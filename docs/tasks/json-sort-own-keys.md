# Task checkpoint: JSON Sort own-key preservation

- Updated: 2026-10-16 Asia/Bangkok
- Branch / base: feature/json-sort-own-keys / develop
- Base SHA: 5937a46012fe3e3143cd5f9165c520a266068f96
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge under AGENTS standing authorization

## Scope and acceptance

JSON Sort key mode silently drops literal __proto__ keys because assigning them
to an ordinary object invokes the inherited setter rather than defining own data.
Preserve every accepted own enumerable JSON key/value in objects, array rows and
NDJSON, ascending/descending, without changing the existing shallow-sort contract,
value mode, numeric/escape semantics or errors. Do not claim global prototype
pollution: observed impact is key loss and possible temporary result prototype
replacement. Fix construction only; no parser or shared UI rewrite.

Non-goals: JSON Sort stale-result/error export lifecycle, unsupported shapes,
nested sorting, numeric-key ordering redesign, resource limits, other tools.

## Completed and pending

Actual service regression suite on original code: 8 failed / 3 passed. Six
__proto__ value variants plus array and NDJSON preservation fail through the real
sortJson API. Ordinary sorting/value mode/error characterization passes. Scratch:
/workspace/work/sort-keys-red.log. No missing-module scaffolding failure.
Choose Object.fromEntries for own data-property construction after the existing
localeCompare sort, avoiding the inherited __proto__ setter with no dependency.
Runtime integration is the inherited sort service only; tests live in the isolated
src/features/json-sort module. Preserve formatting/attribution and directory layout.

## Validation and review

Implemented the two-line own-data-property construction in sortObject. All 11
focused tests now pass. Typecheck, targeted ESLint, 26 security policy tests,
audit gate (15 package findings / 6 advisories, 0 unaccepted high/critical and one
existing temporary exception) and Pages preparation pass. Full unit/build running;
first full run has an observed HtmlToPdf.test.tsx lifecycle failure at 5457ms,
outside changed code. Capture final failure details and isolate after build/full
run finish, without timeout changes. Do not call this run green. Native production/
Pages flows and exact-head CI remain pending. Review
Standards and Requirements separately; self-review is not independent approval.
Public roadmap should reconcile verified PR36, not claim this task merged early.

## Resume point

Finish current unit/build checks (scratch sort-keys-unit.log/build.log); diagnose
observed unrelated HTML lifecycle failure, then validate native flows on all three
engines and Pages. Runtime/test/roadmap/docs changes are uncommitted at this
checkpoint. Create one draft PR into develop and update the same head. Never touch main or
hosting. Preserve untracked public/sitemap.xml exactly, SHA256
5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.
No owned persistent servers yet; local unit/build checks running, no PR yet.
