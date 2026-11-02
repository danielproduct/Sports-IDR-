import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText, splitName, normalizePosition, isValidDate, scoreMatch,
  findCandidates, buildRegistry, canApprove, parseCsv, importCsv,
  escapeHtml, toCsv, exportRegistry
} from '../engine.js';
import { DEMO_RECORDS } from '../sample-data.js';

const record = (source, source_id, name, dob = '', position = 'Midfielder', club = 'Collins Cross FC') => ({
  uid: `${source}:${source_id}`, source, source_id, name, dob, position, club, external_id: ''
});
const scout = record('Scouting', '1', 'Joseph Taylor', '1999-02-14');
const match = record('Matches', '1', 'Joe Taylor', '1999-02-14');

test('normalisation and first-name aliases remain deterministic', () => {
  assert.equal(normalizeText('  JoSé   O’Neil! '), 'jose oneil');
  assert.deepEqual(splitName('Joe Taylor'), { first: 'joseph', last: 'taylor' });
  assert.equal(normalizePosition('Centre-back'), 'defender');
});

test('validates actual calendar dates, not just formatting', () => {
  assert.equal(isValidDate('2000-02-29'), true);
  assert.equal(isValidDate('2001-02-29'), false);
  assert.equal(isValidDate('01/01/2000'), false);
  assert.equal(isValidDate(''), true);
});

test('strong alias and matching DOB are proposed but not merged', () => {
  const matchScore = scoreMatch(scout, match);
  assert.equal(matchScore.eligible, true);
  assert.ok(matchScore.score >= 88);
  assert.equal(buildRegistry([scout, match], new Map()).length, 2);
});

test('same name with conflicting DOB is blocked even at exact name similarity', () => {
  const other = record('Matches', '2', 'Joseph Taylor', '2002-12-12');
  assert.equal(scoreMatch(scout, other).eligible, false);
  assert.equal(scoreMatch(scout, other).conflict, true);
});

test('same-source records never generate candidates', () => {
  const other = record('Scouting', '2', 'Joseph Taylor', '1999-02-14');
  assert.equal(scoreMatch(scout, other).eligible, false);
});

test('missing DOB produces a candidate with a lower, cautious score', () => {
  const withoutDob = record('Matches', '2', 'Joe Taylor');
  const result = scoreMatch(scout, withoutDob);
  assert.equal(result.eligible, true);
  assert.ok(result.score < scoreMatch(scout, match).score);
});

test('review-approved links group the records without altering source rows', () => {
  const candidate = findCandidates([scout, match])[0];
  assert.ok(candidate);
  const decisions = new Map([[candidate.id, 'approved']]);
  assert.equal(canApprove([scout, match], new Map(), candidate).ok, true);
  const groups = buildRegistry([scout, match], decisions);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].records.length, 2);
  assert.equal(scout.name, 'Joseph Taylor');
});

test('a conflicting transitive merge is rejected before modifying decisions', () => {
  const r1 = record('A', '1', 'Joseph Taylor', '1999-02-14');
  const r2 = record('B', '1', 'Joe Taylor');
  const r3 = record('C', '1', 'Joseph Taylor', '2002-02-14');
  const first = findCandidates([r1, r2, r3]).find(c => c.left === r1.uid && c.right === r2.uid);
  const second = findCandidates([r1, r2, r3]).find(c => c.left === r2.uid && c.right === r3.uid);
  assert.ok(first);
  assert.ok(second);
  assert.equal(canApprove([r1, r2, r3], new Map([[first.id, 'approved']]), second).ok, false);
});

test('a rejected pair cannot become merged by transitive approvals', () => {
  const a = record('Scouting', 'A', 'Joseph Taylor', '1999-02-14');
  const b = record('Matches', 'B', 'Joe Taylor', '1999-02-14');
  const c = record('Trials', 'C', 'Joey Taylor', '1999-02-14');
  const candidates = findCandidates([a, b, c]);
  const pair = (first, second) => candidates.find(item => item.left === first.uid && item.right === second.uid);
  const ab = pair(a, b), ac = pair(a, c), bc = pair(b, c);
  assert.ok(ab && ac && bc);
  const decisions = new Map([[ab.id, 'rejected'], [ac.id, 'approved']]);
  assert.equal(canApprove([a, b, c], decisions, bc).ok, false);
});

test('the fictional demo contains intentionally conflicting Alex Morgan DOBs', () => {
  const alexes = DEMO_RECORDS.filter(r => r.name === 'Alex Morgan');
  assert.equal(alexes.length, 3);
  assert.notEqual(alexes[0].dob, alexes[1].dob);
  assert.equal(scoreMatch(alexes[0], alexes[1]).eligible, false);
  assert.equal(alexes[1].dob, alexes[2].dob);
});

test('imports quoted CSV fields and normalises headers', () => {
  const records = importCsv('source_id,name,dob,club,position\r\n"J-1","Joseph ""Joe"" Taylor",1999-02-14,Collins Cross FC,CM\r\n', 'New Trials');
  assert.equal(records[0].source_id, 'J-1');
  assert.equal(records[0].name, 'Joseph "Joe" Taylor');
  assert.equal(records[0].uid, 'New Trials:J-1');
});

test('rejects invalid CSV and duplicate source IDs', () => {
  assert.throws(() => parseCsv('"unterminated'), /unclosed/);
  assert.throws(() => importCsv('name,dob\nJoe,2000-01-01', 'Trials'), /source_id/);
  assert.throws(() => importCsv('source_id,name,dob\n1,Joe,2024-02-31', 'Trials'), /DOB/);
  assert.throws(() => importCsv('source_id,name\n1,Joe\n1,Sam', 'Trials'), /duplicate/);
  assert.throws(() => importCsv('source_id,name\nA|B,Joe', 'Trials'), /source ID/);
});

test('escapes dangerous HTML in dynamic records', () => {
  assert.equal(escapeHtml('<script>"hi" & there</script>'), '&lt;script&gt;&quot;hi&quot; &amp; there&lt;/script&gt;');
});

test('CSV output quotes commas, quotes and newlines', () => {
  assert.equal(toCsv([['a,b', 'c"d', 'x\ny']]), '"a,b","c""d","x\ny"\r\n');
});

test('CSV output neutralises formulas in imported values', () => {
  const generated = toCsv([['=1+1', ' +SUM(A1:A2)', '@cmd', '-2', 'normal']]);
  const fields = parseCsv(generated)[0];
  assert.deepEqual(fields, ["'=1+1", "' +SUM(A1:A2)", "'@cmd", "'-2", 'normal']);
});

test('registry exports source lineage and provisional club IDs', () => {
  const candidate = findCandidates([scout, match])[0];
  const csv = exportRegistry([scout, match], new Map([[candidate.id, 'approved']]));
  assert.match(csv, /club_identity_id,source,source_id/);
  assert.equal((csv.match(/CCF-\d{6}/g) || []).length, 2);
});