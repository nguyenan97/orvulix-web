# Task checkpoint: JSON Minify result ownership

- Updated: 2026-10-16 UTC
- Branch / base: feature/json-minify-result-ownership / develop
- Base SHA: 18634f76d9ed9da9f9f0ea83a072838e7b21d8e5
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge, standing AGENTS authorization; no main release

## Scope and acceptance

Fix /json/minify retaining output after empty input and offering parser error text
as downloadable data. Derive the current output/format synchronously, disable
result actions for empty/invalid/unavailable input and render a generic named inline
error. Recovery removes the error and exports the current valid JSON/JSONL bytes.
Preserve the existing parser/minifier, primitive/NDJSON/blank-line semantics,
numeric precision and normal filenames/extensions. No parser rewrite, resource
limits, shared ToolContent migration, other tools or clipboard notice migration.

## Evidence and design

Two actual-page component regressions fail against the inherited implementation:
clearing retains prior JSON; invalid source becomes parser error output. Tests use
real ToolContent/Formik/service and stub only Monaco. Red log is scratch
/workspace/work/minify-red.log; these are behavior failures, not missing imports.
A small feature module owns typed outcomes; the page integration stays local.
No dependency, hosting, route or locale changes. Parsing remains synchronous.
Preserve untracked public/sitemap.xml hash
5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Validation and review

Implemented typed current outcomes, inline error/output adapter and source-derived
format with the original service unchanged. Focused tests 17 passed; typecheck,
security:test (26), security:check (15 package findings / 6 advisories, 0 unaccepted
high/critical and one existing temporary exception), targeted ESLint and Pages
preparation test passed. Full unit suite and production build running. Production
and Pages native three-engine flows pending. New browser cases are included by the
existing CI code-result spec list. Text style/working diff whitespace pass.
Public roadmap reconciles verified PR35, not a premature claim for this task.
Review Standards and Requirements separately against the full diff. Self-review
is not independent approval. Check exact-head CI/rules before authorized merge.

## Resume point

Complete running unit/build checks (scratch minify-unit.log, minify-build.log),
then native three-engine code/roadmap regressions and Pages smoke. Create one PR
into develop, inspect exact-head CI and full diff, apply merge gates. No PR yet.
Owned checks only, no persistent app server yet. Never stage user sitemap.
