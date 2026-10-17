# Task checkpoint: JSON foundation hardening

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/json-foundation-hardening / develop c94aaf26
- PR: https://github.com/nguyenan97/orvulix-web/pull/38
- Phase: CI
- Delivery mode: develop-merge
- Authorization: fix the discussed foundation issues before new features; no main merge or production deploy.
- Runtime base: 579ab9a051d57d2eb393a5b8cdebded56bc54153 plus final shared-hook/input-test changes validated in the working tree. Final head and merge state are authoritative in PR38.

## Scope and acceptance

JSON Sort derives output/validity from current source and Formik mode/key/order.
Empty/invalid input clears output and disables export; errors are inline rather
than exportable JSON. Recovery, native copy/download, shallow sorting, own keys
and JSON/JSONL formatting remain. Prettify/Minify/Sort enforce documented
source/depth/token/output admission, including Sort header discovery. Shared
text/code imports reject oversized files before FileReader and excessive decoded
text before publication, without truncation. A late commit acknowledging an own
published change must not cancel a newer reader; external replacement/unmount
still cancel. See JSON_RESOURCE_LIMITS.md and TEXT_FILE_IMPORT.md.

Windows validation fixes: shell-free native npm CLI startup, explicit security
test paths, sitemap filesystem-to-URL normalization, portable path assertions,
native clipboard CRLF expectations and native Node imports for SEO validators.
No dependency, exception, hosting/protection or production changes.

Non-goals: new features, larger-document workers, unrelated tool migrations,
Sort primitive-row/missing-key/collation policy and main reconciliation/release.
Admission is not a strict CPU deadline, heap quota or interruption of Monaco work.

## Reproduction and correction history

- Original evaluators: 4 resource regression tests failed.
- Original page/import source: 6 failed / 14 passed (2 Sort, 4 file budgets).
  Earlier incomplete-install/native-binding errors were not behavioral evidence.
- Initial full Windows run failed: 144 files passed / 5 failed; 1332 tests passed /
  2 failed. Three SEO imports failed and two assertions assumed POSIX paths.
  Native imports and portable paths fixed these without removing checks. Hashbang,
  TLA and LF-only experiments were reverted; 24 focused SEO tests then passed.
- Initial production build failed at sitemap path separators after Vite/prerender.
  The corrected validator and subsequent complete production build passed.
- Early native runs found Windows CRLF read-back assumptions and a fixture selecting
  the language combobox. Application write arguments/download bytes remain exact;
  the fixture now asserts the live Sort control and excludes example controls.
- A native run at the earlier hook reported 86 passed / 1 failed on WebKit empty
  replacement, retaining the preceding source. Controlled tests reproduced four
  failures: publish A, start B, commit A (or an own edit) canceled B. Tracking one
  pending own publication corrects that race; external reset/unmount tests remain.
- A prematurely started Pages preflight was canceled during typecheck before Vite;
  production asset paths were verified intact. It was not counted as passed.

## Final local validation

- Node 20.20.0 / Windows x64; npm ci completed and Husky activated.
- Full Vitest: 149 files / 1350 passed, 171.89s, unchanged deadlines.
- Actual-page/hook regression subset: 24 passed after the own-commit correction.
- Native production: 87/87 passed on Chromium/Firefox/WebKit, retries 0, 4.3m.
  Actual Monaco, FileReader, clipboard, option changes and downloaded bytes.
- Previously failing Sort flow repeated three times per engine: 9/9 passed,
  retries 0, 1.2m. Prior failed runs remain recorded above.
- Complete production build/typecheck: 157 route files and 404; sitemap 157 URLs /
  150 lastmod. Existing large-chunk/crypto compatibility notices remain.
- Pages build: 158 validated dev HTML files under /orvulix-web/. Focused native
  Pages flows: 24/24 passed across the same three engines, retries 0, 1.3m.
  Root, all three JSON pages and 404 have noindex, isolated canonical metadata and
  prefixed scripts. This is local evidence, not production HTTP/deployment proof.
- Pages preparation fixture passed; list-worker audit: 18 pure inputs / 10405 bytes.
- All 21 task source/config TypeScript files passed ESLint; the final changed hook/
  test pair passed again. An earlier broad lint included an unchanged no-this-alias
  error in testing/defer-reads.ts; that file was not edited.
- Security policy tests: 26 passed. Fresh audit: 15 package findings / 6 advisories,
  0 unaccepted high/critical, 1 unchanged temporary braces exception.
- Style and full-diff whitespace are checked before commits; no hooks bypassed.

Node-only measurements (7 runs after warmup, GC between): 6000-key / 87781-unit
source Sort baseline median 15.52ms; budgeted Sort 15.79ms (max 22.84ms); header
discovery 5.17ms; Minify 5.34ms. Expanded-output refusal 16.34ms / observed heap
delta 5.93 MiB; oversized input refusal 0.05ms. Heap deltas are not peak memory;
these results do not measure Monaco or promise device-independent browser latency.

## Review and security disposition

Standards review: small isolated modules/adapters, React18/MUI/Formik retained,
no shared ToolContent rewrite, new dependencies, input uploads, paid services,
persistence or security-policy weakening. Own publication tracking retains one
value and reader identity still rejects late callbacks. Windows process helpers
retain shell:false, audit timeout/output/schema/exit validation.

Requirements review: empty/error/option/recovery exports, JSONL/own keys, all
admission boundaries, pre-read refusal and delayed own commits have regression
evidence. Production and prefixed Pages flows passed. No unresolved task-blocking
finding found in the current full diff. These are self-review passes, not
independent approval; actual GitHub reviews/rules remain mandatory.

npm and GHSA-vfj7-8cjw-p6xm still show no patched braces release. Paths are Tailwind
3/chokidar/micromatch and ESLint plugin/fast-glob tooling; no browser-input sink was
identified. The exact exception remains with owner nguyenan97 until 2026-11-13.
Follow-up acceptance: remove affected paths via a reviewed tooling/CSS migration
or upstream fix, with CSS/browser/build/lint/audit checks. No silent expiry extension.

Initial-head Security CI 39028010138 and Pages CI 39028010137 passed at 579ab9a;
feature deployment was intentionally skipped. The five high CodeQL locations
match the base: validate-html.mjs:260 (two rules), pages/prepare.mjs:24,
SeoContent.test.tsx:18, table-text-converter/service.ts:204. Existing bounded
dispositions remain in SECURITY_REMEDIATION.md; this is not a clean static audit.
The final head includes the shared-hook correction and requires its own CI.

## Resume point

Commit/push the final hook/tests/docs candidate, update and mark PR38 ready.
Inspect exact-head checks, CodeQL/flake summaries, current develop and review rules;
merge only the matched approved feature head into develop after all gates pass.
Verify merged ancestry/head and clean up only this completed branch. No main or
production action. Local previews are stopped after verification; work/ contains
only task-owned scratch scripts/logs and is excluded from staging.
