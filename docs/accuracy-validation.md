# Collins Cross FC - identity matching validation

**Status:** Technical POC evaluation | **Date:** 2 November 2026 | **Data:** Fictional adult-player records only

## Decision in brief

The revised engine is useful enough to continue developing as a **human-reviewed identity-suggestion tool** for small football clubs. It is **not** ready to connect live club data. All suggestions require explicit human approval, and the system still has no production authentication, tenant isolation, database, persistent identifiers or data-processing controls.

The matching rules were revised against a synthetic challenge set. A separate additional synthetic holdout was created after those changes and evaluated without further tuning. Neither is a statistically representative sample of real player records.

## Results

Metrics are **pairwise candidate suggestions**: precision = correct suggested pairs / all suggested pairs; recall = correctly suggested pairs / all labelled true pairs. No pairs are merged automatically.

| Dataset | Records | True pairs | Suggested pairs | Correct | Incorrect suggestions | Missed true pairs | Precision | Recall | Recoverable multi-record identities |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Original demo | 30 | 20 | 20 | 20 | 0 | 0 | 100.0% | 100.0% | 10/10 |
| Challenge - original rules | 136 | 47 | 44 | 29 | 15 | 18 | 65.9% | 61.7% | Not measured |
| Challenge - revised rules | 136 | 47 | 50 | 44 | 6 | 3 | 88.0% | 93.6% | 41/43 |
| Additional synthetic holdout | 59 | 19 | 24 | 18 | 6 | 1 | 75.0% | 94.7% | 16/17 |

A multi-record identity is *recoverable* when the correctly suggested links connect all known records for that person, provided a human approves those links. The score shown in the UI is an ordering heuristic, **not a probability** or evidence of a verified identity.

## What changed

- Tightened candidates without corroborating DOB or a shared external person identifier: a close but non-identical name is no longer sufficient on its own.
- Added cautious review suggestions for initials and uncommon first-name variants when an exact DOB and sufficiently similar surname support the link.
- Allowed conservative same-source duplicate suggestions when the full DOB and name evidence agree.
- Added cautious name-order and changed-surname suggestions under specific corroborating conditions.
- Retained hard exclusions for DOB conflicts, conflicting shared external identifiers and rejected pairs that would otherwise be linked indirectly.
- Added validation to prevent approval of an arbitrary, unproposed pair.
- Added reproducible synthetic benchmarks, case-level test fixtures and regression checks.

## Known limitations and concerns

- **False suggestions remain:** distinct people can share a name, date of birth and club. Missing DOB is a major source of ambiguous suggestions. Even "Strong candidate" means **review required**.
- **Missed genuine links remain:** the engine may miss nicknames such as Ted/Edward and Billy/William, and more substantial surname changes without common identifiers.
- **External-ID semantics:** this POC treats `external_id` as belonging to a **shared, person-level namespace**. Source-local identifiers belong in `source_id`. Real integrations will need namespaced external IDs rather than assuming values can be compared across systems.
- **Synthetic bias:** the challenge was used while refining the matching rules. The holdout helps expose overfitting but remains small and synthetic. No real-club accuracy or generalisation claim can be made.
- **Pair recall is not identity recovery:** within a three-record identity, two correct suggested edges may connect all three records even if the third pair is never proposed.
- **No persistence or legal controls:** decisions and provisional IDs disappear on refresh. The service must not be used with real personal data.
- **No automated release assurance:** tests are local. A production implementation needs permission controls, durable change history, tenant isolation, performance limits, privacy review and monitored deployments.

## Repeat the checks

Requires Node.js 20 or newer, no external dependencies:

```sh
npm run check
npm run benchmark
npm run benchmark:json
```

The full labelled fixtures are under `tests/fixtures/`; metric calculations are in `tools/accuracy-benchmark.mjs`. Tests use `node:test` and the independent `truthByUid` labels; those labels are never inputs to the matching function.

## Recommended next gate

Keep this version in the personal GitHub repository as a **synthetic-data POC**. Before onboarding a real club, arrange a private, lawfully sourced and consent/authority-appropriate trial with an experienced reviewer, define source-ID semantics, then measure real review time, error categories and group-level identity correctness. Do not share personal player information in a public GitHub repository or activate hosting as part of this test.