# Collins Cross FC — Sports IDR Lite (Proof of Concept)

A **no-subscription, no-backend** football identity-resolution demonstration using a fictional club, fictional players and three synthetic data sources. The goal is to test whether a small club could link duplicate scouting, match and trialist records through explicit, auditable human decisions.

![Collins Cross FC demo desktop dashboard](docs/desktop-preview.png)

> **Not production-ready.** There is no authentication, database, persistent ID assignment, access control, multi-tenancy, encrypted storage or GDPR-compliant production data handling. Do **not** import real personal data.

## Run locally

Requires Node.js 20+. There are **no external dependencies** or package installations.

```sh
npm start
```

Visit http://127.0.0.1:4173 in your browser.

## What works

- Load 30 **synthetic** records from a scouting register, match records and a trialist log.
- Suggest links using name variants, dates of birth, club and broad playing-position agreement.
- Reject conflicting DOBs / external IDs rather than merging lookalikes.
- Review links individually; approve, reject and undo decisions.
- Block potentially inconsistent transitive links (e.g., one link would combine two different DOBs).
- View a provisional club identity register with the original data lineage retained.
- Export a CSV showing each source record under its provisional club identity.
- Download a sample CSV and import up to 300 additional synthetic rows per file.
- See an in-session decision history and reset the demo.

**All changes are in browser memory** and disappear when the page is refreshed. Nothing is sent to a server. The tiny Node.js server serves only local static files and listens on 127.0.0.1.

## Repository and privacy

Source repository: [`danielproduct/Sports-IDR-`](https://github.com/danielproduct/Sports-IDR-). This repository was **public** when the validation work was started. The published code contains synthetic data only. For private development, change repository visibility in GitHub settings; do not add any personal or confidential club records. **No hosting or deployment is part of this POC.**

## Tests

```sh
npm test
npm run check
```

Tests cover identity aliases, DOB collisions, missing data, candidate scoring, transitive-conflict rejection, source integrity, CSV validation and export. Added labelled challenge/holdout cases, pairwise precision and recall, and review safety checks.

## Data format

CSV columns:

```text
source_id,name,dob,club,position,external_id
T-001,Joseph Taylor,1999-02-14,Collins Cross FC,Midfielder,
```

Required: `source_id`, `name`. DOB is optional, otherwise `YYYY-MM-DD`. Each source record must have a unique `source_id` within its source file. Demo source IDs can contain letters, digits, underscores, dashes, dots or colons (up to 64 characters). Multiple sources are deliberately treated as distinct. Do not use real data until a production data/privacy design exists.

## Simplifying assumptions

- The `external_id` field is a person-level identifier in a **shared namespace** for the demo. Source-specific IDs must remain in `source_id`.

- Only **adult fictional football players**; not coaches, academy children or medical records.
- No purchased sporting data or external AI models.
- Suggestions use deterministic heuristics and are **not calibrated probabilities**.
- A match score is supporting evidence, **never authorisation for automatic linkage**.
- Primarily cross-source suggestions; same-source duplicates may be suggested only with matching DOB and strong name evidence. DOB and shared external-ID contradictions remain blocked.
- Club IDs are **provisional display references**, not durable identifiers. For production, persist UUIDs and record-level identity decisions in a secured database.
- The decision log is not durable; all actions are reset on refresh.

## Accuracy validation (synthetic only)

The matching engine has been evaluated against labelled synthetic datasets. Detailed methods, findings and unresolved risks are in [`docs/accuracy-validation.md`](docs/accuracy-validation.md). This is **not** a real-world accuracy claim. The score in the UI is not a probability.

Run `npm run benchmark` for a concise report or `npm run benchmark:json` for machine-readable output.

## Next validation steps

1. Have an experienced football reviewer test the clarity of suggested links and reasons using fictional data.
2. Decide whether candidate review reduces administrative work without encouraging incorrect identity merges.
3. Define the global-versus-source-specific external ID namespace before any real-data integration.
4. Only after a private, legally appropriate pilot consider database, accounts, hosting, tenancy isolation, data retention and UK/EU processing.

## Project ownership

Independent concept under Dan's Ideas. Collins Cross FC and sample players are fictitious. No PMY source code, brand assets or private client records have been used. No open-source license is granted at this stage.