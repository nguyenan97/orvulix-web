# Task checkpoint: batch-ocr

- Updated: 2026-10-21 UTC
- Branch / base: feature/batch-ocr / develop 467840fefe9cc7760d62259248c2d29b22302f06
- PR: [#64](https://github.com/nguyenan97/orvulix-web/pull/64), develop; reconcile actual head/CI when resuming
- Phase: ready for exact-head CI
- Delivery mode: develop-merge, user requested continuation based on develop;
  AGENTS.md standing authorization applies to this one task.
- Evidence snapshot: pre-push task tree based on the SHA above. Task files were
  staged/uncommitted when this checkpoint was written; resolve delivery head and
  subsequent merge state from actual Git/PR/CI, not these historical pending fields.

## Scope and acceptance

See [feature contract](../BATCH_OCR.md), AC1-AC6, and
[ownership decision](../decisions/batch-ocr-worker-ownership.md).
Risk: trust/resource boundary. Only a complete current run owns ordered artifacts.
Feature owns workers, deadline and Blob URLs; cancel/error/change/unmount releases
resources. Minimal route, SEO and roadmap integration; old OCR/dependencies unchanged.

## Completed and pending

Implemented bounded PNG/JPEG OCR with English/Vietnamese/combined selection,
explicit Run, sequential processing, progress/cancel, atomic TXT/ZIP output.
Tesseract worker/core are installed same-origin Vite assets; pinned models load
only on Run, IndexedDB cache disabled. JSZip export has its own disposable worker.
Licenses/notices are preserved under public/licenses and public/assets.

- AC1/AC2: real Chromium model/PNG/JPEG text and TXT/ZIP pass. ZIP independently
  decoded with Python zipfile. No non-GET requests in the tested flow; no model
  requests before explicit Run. The vie@1.0.0 model/package are available (MIT).
- AC3: UI/engine/ZIP cancellation, stale completion and URL cleanup unit tests pass;
  Chromium startup cancel, network failure and fresh recovery pass.
- AC4/AC5: byte/pixel/count/character limits, APNG rejection, deadline and blank
  recognition warning pass focused tests. Native corrupt pixel recovery passes.
- AC6: metadata/roadmap tests, production build and Pages-prefix smoke pass.
- Latest hardening strips PNG ancillary metadata except transparency from the
  codec working copy, rejects duplicate/unknown critical chunks and caps 512 chunks.
  Focused tests pass; rebuilt production native checks now pass (9 flows).

## Validation and review

- Full local unit suite before metadata hardening: 194 files, 1,998 tests passed.
  Subsequent affected tests including metadata hardening: 35 passed (6 files).
- Final production build (165 indexable routes plus 404), tsc and lint passed.
- Pages build validated 166 HTML files under /orvulix-web/ with noindex. The
  unchanged native spec passed 9/9 across three engines under the prefix; published
  route/asset prefixes and license companions verified against their sources.
  scripts/pages/prepare.test.mjs: 1 passed.
- security:check: 15 package findings / 6 advisories, 0 unaccepted high/critical;
  existing exact braces exception unchanged. security:test: 26 passed.
- Final hardened production native run: 9/9 passed across Chromium, Firefox and
  WebKit, with real models, exact accented text and independent ZIP decoding.
  Mobile screenshot inspected; keyboard controls and no horizontal overflow pass.
  Initial production Chromium 3 flows also passed. Firefox model requests failed with
  SEC_ERROR_UNKNOWN_ISSUER because its temporary NSS store lacked the managed
  proxy CA. Directly importing existing environment roots into NSS restored real
  Vietnamese OCR with TLS verification enabled. Test assertions were not relaxed.
  External local Playwright config installs those roots for fresh NSS profiles;
  install supplied WebKit shared libraries as recorded in previous PNG work.
- Local all-browser harness attempts also exposed missing external-config cwd;
  fixed only scratch config. Those failed/interrupted runs are not passes.
- Text style passed after staging; rerun after final docs. No em dashes.

Self-review findings, corrected within this scope:
1. Requirements: mixed eng-first OCR lost Vietnamese accents. Initialize vie+eng
   for the combined choice; unchanged exact native text assertion passed afterward.
2. Standards/lifecycle: startup handle must precede model load. Own the actual
   classic worker directly, not a hidden nested worker or late promise handle.
3. Standards/resources: header-only pixel admission did not exclude compressed
   PNG metadata expansion in the codec. Strip metadata in a bounded working copy,
   reject duplicate image headers/unknown critical chunks; retain original files.
4. Standards/licensing: URL-imported distributions need their license notices in
   the published artifact. Copy installed license texts and worker notice companion.

Full requirements and standards/security self-review completed against the entire
base/task diff. No remaining task blocker identified; exact-head CI remains a gate.
This is self-review, not independent approval. Existing CodeQL dispositions need
exact-head CI reassessment; a green analysis job alone is not a findings gate.

## Resume point

Inspect Git/PR state; commit/push this reviewed tree as one draft PR into develop,
then mark ready and await exact-head CI/rules, reassess CodeQL identities and fetch
current base before matched-head authorized merge and safe cleanup. Record CI run
links/head SHA in the PR; this historical checkpoint does not claim a future pass.
Scratch: /workspace/work/batch-ocr. Dev server port 5173 is owned by this task.
Local browser configs import the existing managed proxy roots into Firefox NSS;
WebKit uses previously supplied native libraries. Only host library discovery is
skipped locally after supplying those libraries; no assertions or TLS checks are
skipped. CI uses its normal dependency installation and unchanged browser trust.
No production action authorized. No next backlog task is part of this request.

## Visual review follow-up before delivery

At head 2084c3de, reinspection of the native mobile screenshot showed the global
list reset hides ordered-list markers. Output order was correct, but the promised
numbered input list was not visible. Set listStyleType explicitly on the local ol;
no shared CSS or codec behavior changes. A fresh native mobile list screenshot
visibly shows 1/2 markers; affected UI tests (3), lint, tsc and production build
passed. Use new exact-head CI rather than the older run. PR #64 is the single current
PR into develop; reconcile its current head/CI before merge. This is a pre-push
follow-up checkpoint; remote exact-head CI is still pending.
