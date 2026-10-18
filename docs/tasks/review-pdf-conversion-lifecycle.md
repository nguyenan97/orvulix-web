# Task checkpoint: review-pdf-conversion-lifecycle

- Branch/base: feature/review-pdf-conversion-lifecycle / develop 4f56ef6c
- Phase: reviewing; PR pending; delivery mode develop-merge.
- Scope: confirmed R05/R06/R10, user requested all fixes.

PNG/EPUB results currently survive Clear and late jobs. PNG null toBlob never
settles; unbounded geometry allocates a canvas. Both omit PDF.js teardown. Shared
multi-file previews allocate object URLs during render without revocation.

AC1: Clear/replacement/unmount abort current processing, release resources, prevent
late success/error/loading from overwriting current state; current errors recover.
AC2: null canvas Blob rejects; geometry checked before allocation; file/page/pixel/
output/text/time admission controlled, PDFs/pages/canvases cleaned on all exits.
AC3: repeated multi-file rerenders/replacement/unmount balance owned preview URLs;
PNG service returns only blobs/filenames, with no unused URLs.
AC4: actual two-page PNG ZIP has expected dimensions/colors/order; EPUB R02 literal
XML/text fixture remains passing; native lifecycle/recovery covers both tools.

Limits: input 32 MiB, 500 pages, 30s conversion deadline; PNG scale 2, 4096 per side,
8 Mi pixels/page, 32 Mi pixels total, 64 MiB encoded output/ZIP. EPUB 2 Mi UTF-16
text units and 16 MiB archive. Conservative admission, not a hard browser memory
or CPU guarantee. Reject before expensive stages where observable; abort/deadline
terminates PDF.js and prevents publication, but JSZip/arrayBuffer cannot be forcibly
interrupted. Do not claim otherwise.

Boundary: local file -> owned PDF.js loading task -> bounded extraction/render ->
Blob/ZIP -> owned preview/download URL. No dependency/upload/hosting change.
Reuse the existing usePdfMerge current-job pattern in a small PDF conversion hook.
Next: failing null/geometry/resource regressions, minimal lifecycle implementation,
native artifacts and required full validation/review/exact-head CI.

Implementation checkpoint (incomplete): null-Blob and huge geometry tests failed
on baseline. Current services use optional abort signal/owned PDF.js task and caps;
routes use current-job hook; multi-file previews own effect URLs. Removed the
pre-existing unused hidden-copy handler from touched shared result (no UI binding).
11 focused lifecycle/fidelity tests, typecheck and scoped read-only ESLint pass.
Existing EPUB mocks now provide real-contract cleanup/destroy methods; content
assertions unchanged. Still needed: cap/deadline/render abort tests, native PDF
artifacts/lifecycle, full build/unit/security and two full review passes.
R04 PR48 merged at 4f56ef6c. Prepared R11/R12 are delivered before this slice.

Current runtime evidence: 26 focused tests pass, including loading/render/encoder
cancellation, 30s deadline, page/dimension/aggregate pixel admission, owned URL
balance in StrictMode, stale success/error guards and EPUB XML fidelity. Native
PNG ZIPs preserve exact two-page colors/order/dimensions; PNG/EPUB held I/O Clear,
replacement, SPA unmount and invalid-input recovery plus existing EPUB fidelity
pass Chromium/Firefox/WebKit 12/12, zero retries (r05-browser.json). I/O gates delay
startup only; actual PDF.js/canvas/ZIP run. ZIP is mocked only in PNG unit resource
tests; native downloads independently decode actual ZIP and PNG.

Build/typecheck (159 routes and 404), scoped read-only ESLint/style, 26 security
tests and audit gate pass. Full unit suite passes 166 files/1619 tests on this
runtime (local maxWorkers=4, 89.76s). Subsequent additions are only cap tests and
SEO/CI/docs; final integrated build/CI must cover those. Audit retains the exact
temporary braces exception, no dependency/policy change.

Two review passes found and fixed encoder-pending abort cleanup; final tests prove
canvas dimensions reset even before a pending callback. Document loading tasks,
page cleanup, timers and listeners have explicit owners. Native codec/resource
proof retained; no hard memory/CPU or forcible JSZip/arrayBuffer cancellation claim.
No remaining blocking finding. Self-review is not independent approval.
Next: save prepared slice, deliver R12 after merged R11, integrate final develop,
revalidate shared-contract interactions and final build, exact-head CI/merge.

Saved da96b04 and integrated merged R11 at b7d06a3 (develop 3d3e9dee), preserving
both WebP and PDF browser CI steps. Final integrated build/typecheck including SEO
limit copy passes 159 routes plus 404. Two additional output/text cap regressions
pass, focused suite 28/28; unchanged full runtime suite remains 1619 tests above.
R12 PR50 is running; integrate its ToolContent change before this PR delivery.
