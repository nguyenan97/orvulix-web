# Task checkpoint: gif-frame-order

- Updated: 2026-10-20 Asia/Bangkok
- Branch/base: feature/gif-frame-order / develop d36ae541
- PR: not opened
- Phase: reviewed, ready for final commit/PR and exact-head CI
- Delivery mode: develop-merge
- Authorization: user requests prompt and execution, delegates feature choice.
- Implementation checkpoint: f5cc8570d97beb260e8f8bb70050c7a451ebd3fb.
- Final marker/native assertion/workflow-name/checkpoint updates uncommitted.

## Scope and acceptance

[Prompt/contracts/A1-A6](../GIF_FRAME_ORDER.md) own the change. One feature:
adjacent explicit frame moves, current output invalidation and keyboard focus.
No shared input/encoder API changes or dependencies. Risk: file/preview/encode
ownership; importer external sync cancels unfinished batches and retains used URLs.
No new network/storage/active sink, existing app/core assets remain disclosed.

## Completed and pending

Inspected route, job/hook, importer session/hook, GIF encoder and existing tests.
Confirmed importer order is stable identity while encoder uses array order.
Upstream issue433 closed, PR458 merged drag/drop; ordering is an Orvulix enhancement.
Implemented feature-local move/panel and thin route integration; identities,
preview references, shared importer/hook/encoder unchanged. Adjacent move test
failed on initial no-op stub then passed on implementation. This is new feature
behavior evidence, not a reproduced old bug. Focused pure/panel/route/import
tests 31/31 passed, covering duplicate identities, no-op boundaries, focus,
late success/error, busy settlement, retained URLs and aborted import recovery.

Fixed test-only TypeScript issues (optional preview type, Testing Library role
options, mocked revoke typing). Full read-only lint passed after formatting one
long roadmap status line; final changed test lint also passed. Audit passed with
unchanged 15 package findings/6 advisory IDs, exact exception retained; security
tests 26/26 passed. Live rules require build/secret-scan/dependency-audit/codeql
and resolved threads, zero approving reviews. Dev route returned HTTP200 then
task dev server stopped. Initial full unit run: 1942 passed, one SEO title length
failure (61>60) corrected without changing validator. Full isolated rerun passed:
187 files, 1943 tests, unchanged configuration/deadlines. Production build passed
TypeScript, sitemap/404 and 163 indexable routes (141 tools).

First native run passed new pixel-order and genuine EXEC reorder cases on Chromium;
cleanup case failed only because About locator matched header and footer. Stopped
that run, scoped navigation to the footer link and restarted all 81 cases with
workers=1/retries=0. Runtime unchanged; no assertion or timing gate relaxed.
Baseline f5cc8570d97beb260e8f8bb70050c7a451ebd3fb native run 81/81 passed on
Chromium/Firefox/WebKit, workers=1, retries=0 (5.0m), including cleanup after
scoped footer navigation. Long filename/mobile and markup-filename checks passed.
Manual review found a presentation blocker: global CSS resets ol markers, so
the ordered list lacked visible numbers. This finding is corrected below.
New native regression reproduced computed list-style-type none instead of decimal
on the baseline production build. Fixed only ol decimal style and padding 3->4
for two-digit markers. After correction: focused panel/route tests 11/11 passed,
changed runtime/native spec lint passed, fresh production build passed, all three
new native flows passed 9/9 across Chromium/Firefox/WebKit, workers=1, retries=0
(39.7s). Pages build validated 164 dev HTML files under /orvulix-web/; new native
flows passed 9/9 on three engines, workers=1, retries=0 (41.0s), prefix/noindex kept.
Mobile screenshots inspected on all engines: decimal markers, focus outline and
long filenames wrap within 390px. Marker finding closed. Only unaffected full-
suite/encoder evidence is reused from f5cc857; exact-head CI still reruns all gates.

Requirements review: A1-A6 evidenced; displayed order, current Create snapshot,
no automatic encoding and late-result/import ownership verified in actual flows.
Standards/security review: stable keys, bounded list, keyboard focus, retained URL
ownership, React text sinks, no dependency/worker/shared contract/hosting change.
No remaining task blocker or independent approval claimed. Existing CodeQL
identities still require exact-head comparison with their retained dispositions.

Reproducible commands: npx vitest run; npm run lint:check; npm run build;
npm run security:audit; npm run security:test. Native specs: frame-order,
explicit-create, gif-lifecycle and mixed-format with existing production build,
--workers=1 --retries=0. Post-style rerun: frame-order only. Pages:
PAGES_BASE_PATH=/orvulix-web/ node scripts/pages/build.mjs, then frame-order spec
with PLAYWRIGHT_BASE_PATH=/orvulix-web and ignored gif-order-pages.config.ts
serving pages-dist on4174. Actual shell environment syntax is PowerShell.

## Resume point

Stage final four files, run text-style/cached-diff checks, commit and push the
same feature branch. Open one draft PR into develop, verify ready remote
head/base/files, required exact-head checks/rules/reviews before matched-head merge
and verified cleanup. Resolve latest SHA/PR/CI from Git/GitHub rather than the
pre-PR checkpoint. No production release. All task-owned servers stopped.
