import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_RECORDS } from '../sample-data.js';
import { findCandidates, canApprove, buildRegistry, scoreMatch } from '../engine.js';
import { makeAccuracyDataset, ACCURACY_CASES } from './fixtures/accuracy-cases.mjs';

const pair = (a, b) => [a, b].sort().join('|');

function stats(records, truth) {
  const proposals = findCandidates(records);
  const proposedKeys = new Set(proposals.map(x => pair(x.left, x.right)));
  const actual = new Set();
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      if (truth.get(records[i].uid) === truth.get(records[j].uid)) actual.add(pair(records[i].uid, records[j].uid));
    }
  }
  const tp = [...proposedKeys].filter(k => actual.has(k)).length;
  return { proposals, tp, fp: proposals.length - tp, fn: actual.size - tp, positives: actual.size };
}

test('gold labels and source rows remain unique, deterministic and separate', () => {
  const { records, truthByUid } = makeAccuracyDataset();
  assert.equal(records.length, 136);
  assert.equal(truthByUid.size, records.length);
  assert.equal(new Set(records.map(r => r.uid)).size, records.length);
  assert.equal(ACCURACY_CASES.samePerson.length, 43);
  assert.equal(ACCURACY_CASES.differentPeople.length, 24);
});

test('challenging synthetic benchmark achieves fixed minimum suggestion quality', () => {
  const { records, truthByUid } = makeAccuracyDataset();
  const { proposals, tp, fp, positives, fn } = stats(records, truthByUid);
  assert.equal(positives, 47);
  assert.ok(tp / proposals.length >= 0.85, `Expected >=85% precision, got ${tp}/${proposals.length}`);
  assert.ok(tp / positives >= 0.90, `Expected >=90% recall, got ${tp}/${positives}`);
  assert.ok(fp <= 7, `Too many false suggestions: ${fp}`);
  assert.ok(fn <= 5, `Too many missed links: ${fn}`);
});

test('DOB and shared external-ID contradictions can never be approved', () => {
  const { records } = makeAccuracyDataset();
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i], b = records[j];
      const dobConflict = a.dob && b.dob && a.dob !== b.dob;
      const idConflict = a.external_id && b.external_id && a.external_id !== b.external_id;
      if (!dobConflict && !idConflict) continue;
      const suggestion = scoreMatch(a, b);
      assert.equal(suggestion.eligible, false, `${a.uid}|${b.uid}`);
      assert.equal(canApprove(records, new Map(), { id: `${a.uid}|${b.uid}`, left:a.uid, right:b.uid }).ok, false);
    }
  }
});

test('oracle reviewer decisions build only pure identities and preserve all source rows', () => {
  const { records, truthByUid } = makeAccuracyDataset();
  const decisions = new Map();
  for (const candidate of findCandidates(records)) {
    const correct = truthByUid.get(candidate.left) === truthByUid.get(candidate.right);
    if (correct) {
      const safety = canApprove(records, decisions, candidate);
      assert.equal(safety.ok, true, `${candidate.id}: ${safety.reason}`);
    }
    decisions.set(candidate.id, correct ? 'approved' : 'rejected');
  }
  const registry = buildRegistry(records, decisions);
  assert.equal(registry.flatMap(group => group.records).length, records.length);
  for (const group of registry) {
    assert.equal(new Set(group.records.map(r => truthByUid.get(r.uid))).size, 1,
      `Contaminated group ${group.id}`);
  }
});

test('the original demo remains fully recoverable without an automatic merge', () => {
  assert.equal(DEMO_RECORDS.length, 30);
  const candidates = findCandidates(DEMO_RECORDS);
  assert.equal(candidates.length, 20);
  assert.equal(buildRegistry(DEMO_RECORDS, new Map()).length, 30);
});