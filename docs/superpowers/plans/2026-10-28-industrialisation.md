# FIL CLAIR — Implementation plan

> For agentic workers: execute the independent scopes below, with tests before behavior changes and a final independent review. The owner's GO WORK authorizes autonomous reversible implementation; no extra design approval is required.

**Goal:** advance all eight lots using the existing PR #1, preserve validated work, and record evidence without GitHub spending or a public release.

**Architecture:** retain the vanilla local-first PWA. Separate declarative state from provider evidence, keep official API adapters independent of OAuth secrets, and gate every production connector until a qualified OAuth flow and test-account recipe exist. Retain the historical extension without expanding its automation.

**Tech stack:** browser ES modules, Node test runner, Playwright, existing GitHub and Vercel projects, Airtable cockpit.

**Spec:** `docs/WORK_MISSION_FIL_CLAIR.md` and the owner's 2026-10-28 GO WORK budget instructions.

## Global constraints

- Zero additional GitHub expenditure, no Copilot dependency, no paid runner, no artifact/cache upload while quota is unknown.
- No main merge, real social operation, general publication, secret exposure or purchase.
- Physical Android/iOS and legal acceptance cannot be replaced by emulation or a technical memo.
- Never restore an imported confirmation as fresh platform evidence.
- Every delivery and gate remains open until its entire criterion is proven.

## Review focus

- Corrupted startup data must remain exportable and must not be overwritten silently.
- Imported list provenance and revisions must survive export/restore; removing a list must not resurrect prior decisions.
- A timeout after a provider mutation is indeterminate; never retry the write blindly.
- Offline caching must exclude OAuth callbacks, tokens, authenticated API replies and unrelated origin resources.
- Accessible keyboard focus, 320px reflow and screen-reader names require actual browser checks; axe alone is incomplete.

## Task 1 — Governance and cost controls (parent)

Files: `.github/workflows/fil-clair-pwa.yml`, `verification.yml`, `docs/GITHUB_GOVERNANCE.md`, session evidence.

- [x] Read repository visibility, workflows, latest CI and branch rules; inspect billing access read-only.
- [x] Remove redundant PR/push execution and unverified storage use; pin existing actions and preserve check names.
- [ ] Prepare exact main protection configuration; apply only through an authorized admin surface and reread it.
- [x] Verify YAML and static cost invariants locally. Commit coherent changes after review.

## Task 2 — SAFE data and accessible offline PWA (two independent scopes)

Data files: `pwa/core.js`, `tests/pwa-core.test.js`; parent integrates `pwa/app.js`.
UX/QA files: `pwa/index.html`, `pwa/styles.css`, `pwa/sw.js`, `scripts/test-pwa.mjs`, `scripts/audit-pwa.mjs`.

- [x] Add failing regressions for rejected corrupt startup/backups, revision/provenance round-trip and cleanup/re-add behavior.
- [x] Implement bounded data helpers compatible with valid v1 backups and export list metadata.
- [x] Exercise browser workflows, storage denial/quota, offline reload, keyboard and 320px reflow; fix measured failures.
- [x] Record exact engines, versions, emulation limits and test results. Keep physical-device gates open.

Interfaces: core exports remain backward-compatible; any new helpers are documented to parent before app integration. QA does not edit app.js or core.js.

## Task 3 — Official API qualification and orchestration (parent + researcher)

Files: `pwa/connectors/*.js`, `tests/connectors.test.js`, `tests/orchestration.test.js`, official API qualification document.

- [x] Verify current primary documentation for OAuth, scopes, revocation, identity binding and provider readback.
- [x] Define injectable authenticated transport; default is disabled and no live network call is permitted by tests.
- [x] Write tests for explicit consent, identity mismatch, 401/403, 429 cooldown, duplicate operations, cancellation and ambiguous timeout.
- [x] Implement separate declared/accepted/confirmed/indeterminate results and safe single-operation execution.
- [x] Document exact remaining OAuth/deployment/test-account blockers instead of presenting adapters as connected production accounts.

## Task 4 — Privacy, operations and evidence (document scope + parent)

Files: `docs/PRIVACY_ASSESSMENT.md`, `docs/OPERATIONS.md`, `pwa/privacy.html`, `docs/evidence/2026-10-28-session.md`.

- [x] Map actual data, hosting logs, potential political opinions, retention/export/deletion, AIPD decision inputs and unresolved controller details using primary CNIL/EU sources.
- [x] Prepare monitoring, incident triage, backup/restore and immutable deployment rollback with a local drill.
- [ ] Run independent final review and meaningful local/eligible CI checks once per coherent head.
- [ ] Verify protected Vercel deployment provenance; update Airtable lots, recipe gates and session log with Fait/Ouvert/Vérifié comment/Périmé.

Pre-flight: Data helpers → parent app integration; parent follows actual exported API and does not invent it. QA shell changes → parent connector deployment; no connector resource is cached until the offline allowlist and authentication exclusions are reviewed. Documentation → parent status update; evidence outranks reported completion.
