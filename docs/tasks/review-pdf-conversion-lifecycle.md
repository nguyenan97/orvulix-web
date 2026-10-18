# Task checkpoint: review-pdf-conversion-lifecycle

- Branch/base: feature/review-pdf-conversion-lifecycle / develop ec6abf15
- Phase: developing; PR pending; delivery mode develop-merge.
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
