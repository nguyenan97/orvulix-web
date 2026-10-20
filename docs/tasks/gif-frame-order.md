# Task checkpoint: gif-frame-order

- Updated: 2026-10-20 Asia/Bangkok
- Branch/base: feature/gif-frame-order / develop d36ae541
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge
- Authorization: user requests prompt and execution, delegates feature choice.
- Clean fast-forwarded develop and no open PR verified; task edits uncommitted.

## Scope and acceptance

[Prompt/contracts/A1-A6](../GIF_FRAME_ORDER.md) own the change. One feature:
adjacent explicit frame moves, current output invalidation and keyboard focus.
No shared input/encoder API changes or dependencies. Risk: file/preview/encode
ownership; importer external sync cancels unfinished batches and retains used URLs.
No new network/storage/active sink, existing app/core assets remain disclosed.

## Completed and pending

Inspected route, job/hook, importer session/hook, GIF encoder and existing tests.
Confirmed importer order is stable identity while encoder uses array order.
Upstream433 closed, PR458 merged drag/drop; ordering is an Orvulix enhancement.
Implemented feature-local move/panel and thin route integration; identities,
preview references, shared importer/hook/encoder unchanged. Adjacent move test
failed on initial no-op stub then passed on implementation. This is new feature
behavior evidence, not a reproduced old bug. Focused pure/panel/route/import
tests31/31 passed, covering duplicate identities, no-op boundaries, focus,
late success/error, busy settlement, retained URLs and aborted import recovery.

Fixed test-only TypeScript issues (optional preview type, Testing Library role
options, mocked revoke typing). Full read-only lint passed after formatting one
long roadmap status line; final changed test lint also passed. Audit passed with
unchanged15 package findings/6 advisory IDs, exact exception retained; security
tests26/26 passed. Live rules require build/secret-scan/dependency-audit/codeql
and resolved threads, zero approving reviews. Dev route returned HTTP200 then
task dev server stopped. Initial full unit run:1942 passed, one SEO title length
failure61>60 corrected without changing validator. Full isolated rerun passed:
187 files, 1943 tests, unchanged configuration/deadlines. Production build passed
TypeScript, sitemap/404 and163 indexable routes (141 tools).

First native run passed new pixel-order and genuine EXEC reorder cases on Chromium;
cleanup case failed only because About locator matched header and footer. Stopped
that run, scoped navigation to the footer link and restarted all81 cases with
workers=1/retries=0. Runtime unchanged; no assertion or timing gate relaxed.
Active session69981. Long filename/mobile and markup-filename text checks included.
Chromium27/27 passed, including cleanup after scoped footer navigation. Manual
mobile review found a real remaining presentation blocker: global CSS resets ol
markers, so the ordered list lacks visible numbers. Restore explicit decimal
list style and add native computed-style regression after this baseline run.

## Resume point

Implement one red/green adjacent-move contract, panel and thin route integration.
Validate A1-A6, full lint/unit/build/security and production/Pages native flows.
Review full diff twice, commit/push one draft PR into develop, verify ready remote
head/base/files, required exact-head checks/rules/reviews before matched-head merge
and verified cleanup. No production release. No running task servers.
