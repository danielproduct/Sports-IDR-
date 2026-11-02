# Collins Cross FC — Sports IDR Lite (Proof of Concept)

A **no-subscription, no-backend** football identity-resolution demonstration using a fictional club, fictional players and three synthetic data sources. The goal is to test whether a small club could link duplicate scouting, match and trialist records through explicit, auditable human decisions.

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

## Where to keep it

Source repository: [`danielproduct/Sports-IDR-`](https://github.com/danielproduct/Sports-IDR-), using **Collins Cross FC** as the fictional demonstration club. The repository is currently **public**, so only original, synthetic data and source files belong here. **No hosting or deployment is part of this POC.**

## Tests

```sh
npm test
npm run check
```

Tests cover identity aliases, DOB collisions, missing data, candidate scoring, transitive-conflict rejection, source integrity, CSV validation and export.

## Data format

CSV columns:

```text
source_id,name,dob,club,position,external_id
T-001,Joseph Taylor,1999-02-14,Collins Cross FC,Midfielder,
```

Required: `source_id`, `name`. DOB is optional, otherwise `YYYY-MM-DD`. Each source record must have a unique `source_id` within its source file. Demo source IDs can contain letters, digits, underscores, dashes, dots or colons (up to 64 characters). Multiple sources are deliberately treated as distinct. Do not use real data until a production data/privacy design exists.

## Simplifying assumptions

- Only **adult fictional football players**; not coaches, academy children or medical records.
- No purchased sporting data or external AI models.
- Suggestions use deterministic heuristics and are **not calibrated probabilities**.
- A match score is supporting evidence, **never authorisation for automatic linkage**.
- Only cross-source candidate links are suggested, with DOB and external-ID contradictions blocked.
- Club IDs are **provisional display references**, not durable identifiers. For production, persist UUIDs and record-level identity decisions in a secured database.
- The decision log is not durable; all actions are reset on refresh.

## Next validation steps

1. Have a football person verify whether the candidate suggestions are understandable and appropriately cautious.
2. Create a known-answer synthetic evaluation set and measure **false-positive links**, recall and the number of manual reviews.
3. Decide whether the review flow creates enough value before introducing database, accounts or hosting.
4. Only then consider real-data onboarding, legal bases, tenancy isolation, access controls, data retention and UK/EU processing requirements.

## Project ownership

Independent concept under Dan's Ideas. Collins Cross FC and sample players are fictitious. No PMY source code, brand assets or private client records have been used. No open-source license is granted at this stage.