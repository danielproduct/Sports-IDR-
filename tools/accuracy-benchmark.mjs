import { findCandidates, scoreMatch } from '../engine.js';
import { makeAccuracyDataset, ACCURACY_CASES } from '../tests/fixtures/accuracy-cases.mjs';
import { DEMO_RECORDS } from '../sample-data.js';
import { makeHoldoutDataset, HOLDOUT_COUNTS } from '../tests/fixtures/holdout-cases.mjs';

function pairKey(a, b) { return [a, b].sort().join('|'); }
function pct(num, den) { return den ? Math.round(10000 * num / den) / 100 : null; }
function evaluate(records, truthByUid, scenarios = new Map()) {
  const candidates = findCandidates(records);
  const predicted = new Set(candidates.map(c => pairKey(c.left, c.right)));
  const actual = new Set();
  for (let a = 0; a < records.length; a++) {
    for (let b = a + 1; b < records.length; b++) {
      if (truthByUid.get(records[a].uid) === truthByUid.get(records[b].uid)) actual.add(pairKey(records[a].uid, records[b].uid));
    }
  }
  const truePositive = [...predicted].filter(k => actual.has(k));
  const falsePositive = [...predicted].filter(k => !actual.has(k));
  const falseNegative = [...actual].filter(k => !predicted.has(k));
  const byId = new Map(records.map(r => [r.uid, r]));
  const getScenario = k => scenarios.get(k)?.tag || 'cross-case';
  const flagged = keys => keys.map(k => {
    const [a, b] = k.split('|');
    return { key:k, scenario:getScenario(k), left:byId.get(a)?.name, right:byId.get(b)?.name,
      dobLeft:byId.get(a)?.dob, dobRight:byId.get(b)?.dob,
      score: scoreMatch(byId.get(a),byId.get(b)).score };
  });
  const strong = candidates.filter(c => c.tier === 'Strong candidate');
  const strongCorrect = strong.filter(c => actual.has(pairKey(c.left, c.right)));
  // A group can be fully recovered from a spanning set of correct suggestions;
  // suggesting every pair in the group is not always necessary.
  const parents = new Map(records.map(r => [r.uid, r.uid]));
  const root = uid => {
    let current = uid;
    while (parents.get(current) !== current) current = parents.get(current);
    return current;
  };
  for (const candidate of candidates) {
    if (truthByUid.get(candidate.left) === truthByUid.get(candidate.right)) {
      parents.set(root(candidate.right), root(candidate.left));
    }
  }
  const groupIds = new Map();
  for (const r of records) {
    const group = truthByUid.get(r.uid);
    if (!groupIds.has(group)) groupIds.set(group, []);
    groupIds.get(group).push(r.uid);
  }
  const multiRecordGroups = [...groupIds.values()].filter(ids => ids.length > 1);
  const fullyRecoverable = multiRecordGroups.filter(ids => new Set(ids.map(root)).size === 1);
  return {
    recordCount:records.length, actualPositivePairs:actual.size, proposedPairs:predicted.size,
    tp:truePositive.length, fp:falsePositive.length, fn:falseNegative.length,
    precisionPct:pct(truePositive.length,predicted.size), recallPct:pct(truePositive.length,actual.size),
    f1Pct:pct(2*truePositive.length,2*truePositive.length+falsePositive.length+falseNegative.length),
    strongProposals:strong.length, strongCorrect:strongCorrect.length,
    strongPrecisionPct:pct(strongCorrect.length,strong.length),
    multiRecordIdentities:multiRecordGroups.length,
    fullyRecoverableIdentities:fullyRecoverable.length,
    recoverabilityPct:pct(fullyRecoverable.length,multiRecordGroups.length),
    fpExamples:flagged(falsePositive), fnExamples:flagged(falseNegative)
  };
}

const demoTruth = new Map();
const demoIdentityGroups = [
  ['S-001','M-101','T-201'], ['S-002','M-102','T-202'], ['S-003','M-103','T-203'],
  ['S-004','M-104'],['S-005','T-204'],['M-105','T-209'],['S-006','M-106','T-205'],
  ['S-007','M-107','T-206'],['S-008','T-207'],['S-010','M-108']
];
for (let i = 0; i < demoIdentityGroups.length; i++) {
  for (const sourceId of demoIdentityGroups[i]) {
    const record = DEMO_RECORDS.find(r => r.source_id === sourceId);
    if (!record) throw new Error(`Missing demo source ID: ${sourceId}`);
    demoTruth.set(record.uid, `DEMO-${i}`);
  }
}
for (const record of DEMO_RECORDS) if (!demoTruth.has(record.uid)) demoTruth.set(record.uid, `DEMO-SOLO-${record.uid}`);

const challenge = makeAccuracyDataset();
const holdout = makeHoldoutDataset();
const report = {
  methodology:'Candidate-link pairwise evaluation; all records and truth labels are fictional; no automatic merges.',
  fixtureSummary:{linkedCases:ACCURACY_CASES.samePerson.length,distinctCases:ACCURACY_CASES.differentPeople.length,holdout:HOLDOUT_COUNTS},
  demo:evaluate(DEMO_RECORDS,demoTruth),
  challenge:evaluate(challenge.records,challenge.truthByUid,challenge.scenarioByPairKey),
  holdout:evaluate(holdout.records,holdout.truthByUid)
};
if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(report,null,2)+'\n');
else {
  for(const [name,x] of Object.entries(report).filter(([,x])=>x?.recordCount)) {
    console.log(`${name}: ${x.recordCount} records, ${x.actualPositivePairs} true links, ${x.proposedPairs} suggestions`);
    console.log(`  Pair precision ${x.precisionPct}% (${x.tp}/${x.proposedPairs}); recall ${x.recallPct}% (${x.tp}/${x.actualPositivePairs}); FP ${x.fp}, FN ${x.fn}`);
    console.log(`  Strong suggestions ${x.strongProposals}, correct ${x.strongCorrect} (${x.strongPrecisionPct}%)`);
    console.log(`  Recoverable multi-record identities ${x.fullyRecoverableIdentities}/${x.multiRecordIdentities} (${x.recoverabilityPct}%)`);
    console.log('  False-positive cases: '+[...new Set(x.fpExamples.map(e=>e.scenario))].join(', '));
    console.log('  Missed-link cases: '+[...new Set(x.fnExamples.map(e=>e.scenario))].join(', '));
  }
}