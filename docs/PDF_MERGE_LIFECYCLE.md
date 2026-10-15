# Merge PDF lifecycle

## Scope and evidence

Implemented through [PR #29](https://github.com/nguyenan97/orvulix-web/pull/29);
resolve merged state there before
assuming delivery to develop. This is not a production release. Base fd1214d has
an observed bug: select a PDF, Clear while merge is pending, finish the original
merge; merged.pdf reappears despite empty input. The regression failed with
expected empty / received merged.pdf, then passed after the ownership integration.

Keep automatic merge, selection/page order, original page geometry/content and
merged.pdf. No new options, form behavior, Split PDF changes, URL converter,
worker migration or generic job framework. The source PDF is not sanitized;
merging is not a way to make untrusted PDF documents safe.

## Ownership and bounds

Core: src/features/pdf-merge/merge.ts and usePdfMerge.ts. Selection edits/Clear
invalidate immediately and abort the active controller before updating input.
Every compute snapshots File references in selection order. Only its current
controller may publish result, failure or loading completion. Unmount aborts and
removes ownership; late success/error is consumed. Errors use a bounded actionable
inline message without parser internals. Existing ToolFileResult owns/revokes
preview/download URLs; the merge core creates none.

Reuse the importer budgets: 20 PDFs, 32 MiB each, 128 MiB combined, nonempty files.
The service repeats preflight for direct callers and permits supported single-file
merge. Additional budgets: 500 pages total, 64 MiB encoded output, 30-second
monotonic elapsed acceptance checks. Reject zero-page/corrupt/encrypted inputs.
Checks occur before/after awaited creation/read/load/copy/save and between page
additions, including after an elapsed timer would have been delayed.

Cancellation is cooperative: File reads and synchronous pdf-lib parsing/copying/
encoding cannot be preempted. There is no worker timeout, hard CPU/memory quota or
promise that hostile compressed PDFs cannot allocate excessively. The encoded
byte cap is checked after save allocation, before publishing or constructing the
File. Existing large-input/decoder risks remain; stronger isolation needs its own
worker design. Source references and PDF objects are released when the async run
settles, not immediately on Clear. No shared mutable run state in the service.

## Validation

Lifecycle unit tests isolate only input/result UI and the asynchronous service
boundary; real ToolContent/Formik effects run. They cover Clear, superseding runs,
stale success/error/loading, unmount, current error and recovery. Service tests
use actual PDF bytes for page order/geometry/content, single-file behavior, page
limits and invalid files; encoder failure/output cap use a focused encoding mock,
not fidelity evidence. Monotonic-clock test rejects a late read without relying on
timer callback delivery.

Native browser flows use the genuine importer and merge. A deterministic gate
holds only the second File read (merge, after import validation) for Clear, input
removal/replacement, SPA navigation and error recovery. It does not fabricate
successful PDF output. Downloaded PDFs are parsed with pdf-lib; a separate
PDF-to-PNG tool flow runs real PDF.js and checks red/blue/red page pixels and
portrait/landscape geometry. Mobile keyboard Clear and horizontal layout are
covered. Exact commands/results and CI evidence live in the task checkpoint/PR;
pending checks are not passes.

Local validation at code commit 781f2cb: 29 affected unit tests, full 136-file /
1227-test suite, production/typecheck/157-route sitemap+404 validation and security
checks passed. Native browsers: 18/18 across Chromium/Firefox/WebKit without retries.
Pages build validated 158 HTML files; three-engine Pages merge/download/PDF.js
pixel smoke passed under /orvulix-web/, with noindex, no production canonical and
prefixed assets/worker. Final exact-head CI and merge evidence live in PR29.

## Sync hotspots and rollback

Two inherited adapters: merge-pdf/index.tsx and service.ts. Preserve optional
AbortSignal forwarding when syncing upstream. The shared input, ToolContent and
ToolFileResult are unchanged. CI adds only this focused browser spec. No new
dependency, routing, metadata, hosting policy or locale changes.

Rollback the merge adapters and remove this feature module; it leaves other PDF
consumers unchanged. Owner: Orvulix maintainer. Follow-up acceptance for any future
worker isolation must include actual PDF fidelity, abort during parsing/encoding,
resource release, supported browsers and Pages asset loading; it is not delivered
by this cooperative fix.
