# Task checkpoint: JSON Sort own-key preservation

- Updated: 2026-10-16 Asia/Bangkok
- Branch / base: feature/json-sort-own-keys / develop
- Base SHA: 5937a46012fe3e3143cd5f9165c520a266068f96
- PR: https://github.com/nguyenan97/orvulix-web/pull/37
- Phase: CI
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

Runtime/tests/docs implementation commit: 5cf9165ecca0ba21d599cd1d3b977a7cf8a792c4.
This checkpoint update is documentation-only. PR37 and Git/CI metadata record final
head/delivery; pending checks below must not be inferred as passed.

- New real-service suite: 11 passed, including the eight red-before-fix cases.
- Typecheck and targeted ESLint passed; runtime diff is 2 added / 3 removed lines
  in the inherited sort service. No extra production module is justified for it.
- Production build passed: 157 static routes, 404 and sitemap 157 URLs / 150 lastmod.
- List worker audit passed: 18 pure inputs; emitted worker 10405 bytes.
- Security policy tests 26 passed. Audit: 15 package findings / 6 advisories,
  0 unaccepted high/critical, one unchanged temporary exception.
- First-head Security CI 38879990684 passed. Same five high CodeQL findings as
  base: bad-tag-filter at scripts/seo/validate-html.mjs:260; incomplete-multi-character-
  sanitization at scripts/pages/prepare.mjs:24 and scripts/seo/validate-html.mjs:260;
  double-escaping at src/seo/SeoContent.test.tsx:18; incomplete-sanitization at
  string/table-text-converter/service.ts:204. No new task finding; not a clean audit.
- Initial concurrent local full suite FAILED: 1330 passed / 1 failed. The unchanged
  HtmlToPdf.test.tsx 'aborts edits, ignores late result, recovers and revokes result
  URLs' timed out at 5000ms. After build/full run finished, isolated whole file
  passed 6/6, test phase 3.09s, without changing source/assertions/timeout. Cause is
  unconfirmed; do not label the failed run green or assert CPU contention as fact.
- Full suite is now running sequentially without local build/browser concurrency.
  Native three-engine production and Pages flows remain pending. Pages preparation
  fixture passed. Existing CI list already includes the extended code-result spec.
- Text style and full-PR whitespace passed; rerun after this checkpoint commit.

Standards review: own-data-property construction avoids the inherited setter;
no globals, eval, HTML injection, dependencies, broad reformat or shared UI changes.
Object.fromEntries allocates entry pairs in addition to existing sorted keys; this
is not a memory optimization or hard resource-bound claim. Caller receives only
serialized text, preserving the existing API. Requirements review: own data for
six __proto__ value kinds, object-array/NDJSON row order, shallow nested values,
normal key direction, integer keys and unchanged value mode have service evidence.
Native clipboard/download/options evidence is still required. No blocking defect
found in inspected code; acceptance/CI gates are not yet complete. These are
self-review passes, not independent approval. Check actual repository review rules.

## Resume point

Wait for /workspace/work/sort-keys-unit-sequential.log. Then run the native
code-result spec plus roadmap cases on Chromium/Firefox/WebKit (production build
already available), retries 0. Only afterwards run Pages build and the 12 JSON Sort/
roadmap prefix cases. Do not overwrite dist during browser tests.
Scratch logs use sort-keys-*.log under /workspace/work. Update PR37 body with actual
checks/failure disposition and exact latest-head CI; checkpoint predates completion.
If the unchanged HTML timeout recurs, diagnose with new evidence rather than
raising limits. Maintainer follow-up acceptance: reproduce under controlled load,
identify timer/readiness cause and retain cancel/recovery assertions unchanged.

When all acceptance/review/CI gates pass, fetch latest develop/main, inspect rules/
comments, merge matched head into develop and verify ancestry/tree. Then safely
remove only this task branch after checking remote head, other PRs and worktrees.
No production release or manual deploy. Preserve user untracked public/sitemap.xml,
SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.
