# Task checkpoint: JSON Minify result ownership

- Updated: 2026-10-16 UTC
- Branch / base: feature/json-minify-result-ownership / develop
- Base SHA: 18634f76d9ed9da9f9f0ea83a072838e7b21d8e5
- PR: https://github.com/nguyenan97/orvulix-web/pull/36
- Phase: CI
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

Runtime/test tree: d6181eb51476fca2e88a87f5b5d84948895b76cc. This checkpoint
update is documentation-only; final delivery/head/merge evidence belongs in PR36.

- Focused new tests: 17 passed; full suite: 1320 tests / 145 files passed.
- Typecheck and targeted ESLint passed. Production build: 157 routes plus 404;
  dirty-source build omitted one lastmod before commit, without route loss.
- Production native code-editor and roadmap flows: 42 passed across Chromium,
  Firefox and WebKit, retries 0. Includes both new Minify flows, existing Prettify,
  native copy/download, insecure-origin policy and static/React roadmap behavior.
- Security policy tests: 26 passed. Audit: 15 package findings / 6 advisories;
  0 unaccepted high/critical, one pre-existing temporary exception unchanged.
- First-head Security CI: 38873867650 passed. CodeQL reports the same five high
  findings as base: bad-tag-filter at scripts/seo/validate-html.mjs:260;
  incomplete-multi-character-sanitization at scripts/pages/prepare.mjs:24 and
  scripts/seo/validate-html.mjs:260; double-escaping at src/seo/SeoContent.test.tsx:18;
  incomplete-sanitization at string/table-text-converter/service.ts:204. No new
  finding in task scope. This does not resolve the inherited findings.
- Pages preparation fixture passed; full Pages build/smoke running/pending.
- List worker audit passed: 18 pure inputs, emitted 10405 bytes.
- Text style and full-PR whitespace passed; rerun after this checkpoint commit.

Standards review: isolated typed module; no any, new dependencies, HTML injection,
queued output/error state, shared-tool migration or deployment changes. No parse
messages containing source are exposed. Whole-input synchronous allocation and
already initiated native actions remain explicit limitations (see JSON_MINIFY.md).
Requirements review: original two behavior regressions red before fix; current
output/action ownership, native recovery, JSONL bytes/extensions and valid service
semantics verified. Public roadmap records only previously merged PR35, not this
branch as delivered. No task-blocking finding found in the full diff. These are
self-review passes, not independent approval. Actual repository rules still apply.

## Resume point

Check actual Git/PR/CI state before acting. Finish Pages build and run the 12
Minify/roadmap native cases with COPY_TEST_PREFIX=/orvulix-web using the scratch
Pages config. Final results must update PR36 body, not be inferred from this file.
Scratch logs: /workspace/work/minify-{unit,browser,pages-build,pages-browser}.log.
Then mark PR ready, inspect exact latest-head CI and current develop/main/rules/
comments. Merge only after all acceptance and CI gates, then verify ancestry and
safely delete only this feature branch. No main release or manual deployment.
Preserve user sitemap; it remains untracked with the hash recorded above.
