# Selective upstream sync

Review snapshot: 2026-10-14. Source is iib0011/omni-tools main at
[cf41a30](https://github.com/iib0011/omni-tools/commit/cf41a30dda37e1f33deeeb03f959295c249c2beb).
Orvulix integration base is develop at a32c133. Common merge-base is
[3bbca2f](https://github.com/iib0011/omni-tools/commit/3bbca2fdc076d972ff21144e58dd6ef0480655f0),
the October 4 split-image correction. There are 13 upstream-reachable commits
outside develop at this snapshot, including merge/side-branch and coverage commits;
this is not 13 missing features. No later full upstream sync was identified in
Orvulix history; prior backlog/research commits are not imports.

## Comparison and boundaries

Fetch origin/develop and upstream/main, determine merge-base, read first-parent
merges and compare actual files/dependency paths. Review GitHub merged PR/issue
states as well as implementation. Full-file diff contains intentional Orvulix
branding, routing/SEO/Pages, bounded workers, security and SDLC changes: do not
copy or merge the complete upstream tree. An identical current file or a fix in
the common history is not a new task. Record port decisions even when ancestry
cannot represent a manually adapted change.

The existing scheduled upstream-check workflow counts HEAD..upstream/main on its
checked-out branch. Its count is an ancestry notice, not a semantic sync verdict;
main remains the default branch. This task changes no schedule or hosting policy.
Future reviews should use this source snapshot plus current implementation, not
assume every counted commit still needs importing.

## Candidates reviewed

| Candidate and source | Orvulix status / value | Integration and decision |
| --- | --- | --- |
| PNG dimension correction, merged [#461](https://github.com/iib0011/omni-tools/pull/461), merge d50335a and implementation [1fe23b4](https://github.com/iib0011/omni-tools/commit/1fe23b43d237c367e63e07f5e0cfc94bd5fb05f3) | Missing: current tool sets maxWidthOrHeight=1024 and passes unsupported quality. Reproduced 1600x100 input exported as 1024x64. | Selected: adapt native dimensions, non-inflation and effective palette-quality options using installed browser-image-compression 2.0.2. No wholesale encoder/batch rewrite. |
| Shared multi-file drag/drop, merged [#458](https://github.com/iib0011/omni-tools/pull/458), [b2e6f0b](https://github.com/iib0011/omni-tools/commit/b2e6f0ba30b13a2619020f64c1a63470dae39065), issue #433 closed | Missing: local multiple-image picker has no drop handlers; upstream adds a shared hook across image/audio/video/PDF, nested drag counters, accept filtering and distinct order values. | Deferred: four shared inputs plus hook/locales. Review file count/bytes, async imports vs clear/unmount and preview URL ownership before porting. GIF timing/Create/quality are separate and not all solved by the closed issue. |
| Split-image partial PDF scale, merged [#471](https://github.com/iib0011/omni-tools/pull/471), 3bbca2f | Already in shared baseline; current split service is identical to upstream at review and covered by Orvulix PDF tests. | No repeat import; preserve existing coverage. |
| Table text converter, merged [#469](https://github.com/iib0011/omni-tools/pull/469), a63e12c | Already present; service is identical at review. Markdown downstream/backslash disposition remains in security docs. | No repeat import; separate security/formatting follow-up. |
| Left truncate to zero, merged [#467](https://github.com/iib0011/omni-tools/pull/467), f818afe | Already in common history; current service is identical to upstream. | No repeat import. |
| Translation platform menu, merged [#459](https://github.com/iib0011/omni-tools/pull/459), bdda1f8 | In common upstream history; Orvulix navbar intentionally has its own branding/navigation. | Do not copy upstream navbar over customization. |
| README translation coverage, merged #475/#476 | Documentation coverage maintenance, not runtime correctness. | Skip wholesale README replacement; retain Orvulix hosting/product documentation. |

Only the selected PNG task is implemented by this feature branch. Other rows
are reviewed/deferred, not a promise to start the next task automatically.

## PNG adaptation and contract

Provenance: upstream #461's dimension-preserving/non-inflation intent. This is a
manual adaptation, not a cherry-pick of its custom median-cut/CompressionStream
encoder or batch/ZIP controls. Upstream MIT attribution remains in LICENSE;
existing browser-image-compression licensing is retained. No new dependency.

Actual installed runtime inspection matters: version 2.0.2 already uses UPNG for
PNG encoding and accepts initialQuality/alwaysKeepResolution. The previous tool's
quality field was not the supported option. Do not repeat the upstream PR prose
that merely removing resize makes this installed library incapable of compression.

For supported static PNG, output preserves input width/height. Remove the 1024px
cap, set alwaysKeepResolution, pass validated initialQuality and keep the original
if the encoded file would be larger/equal. Inspect smaller output geometry and
reject a silent browser/library resize instead of returning it. Preserve filename
and normalize valid empty-MIME PNG. The 1 MiB target is best effort; colors and
metadata may change. Dimension preservation is not lossless pixel optimization,
and does not complete the separate lossless optimizer idea (#359).

Compression preflight: at most 16 MiB, 4096px per side, 8,000,000 pixels and 512
chunks; finite positive geometry and bounded chunk traversal; reject truncated
structure, duplicate IHDR, trailing bytes, absent IDAT/IEND and APNG acTL. This is
geometry/chunk preflight, not a full CRC/decoder/security proof. The native encoder/
decoder still validates image content. Shared image-input preview can native-decode
before this compressor preflight; this PR does not bound every image tool/preview.

Use the existing library's worker mode with an own-origin Vite asset URL, preserving
Pages prefix. The library can fall back to the main thread; no hard CPU/memory
quota or guaranteed preemption of native/synchronous work is claimed. Abort on
new input/options/clear/unmount, ignore late results/errors and remove stale output.
Resource caps are conservative new acceptance limits, not an unrestricted decoder.

## Validation and sync hotspots

Baseline Chromium export demonstrated the 1600x100 -> 1024x64 regression. Unit
coverage checks geometry/chunk/option boundaries, aborts, non-inflation, mismatch
rejection and UI job ownership/recovery. Native browser tests must decode actual
landscape/portrait PNG output, check alpha/edge pixels, Unicode filenames and size,
plus invalid-rate recovery without stale output. Worker assets must not require
jsDelivr and must load under production/Pages paths. Record exact-head runs in PR.

Hotspots: one existing compress-png UI adapter, related English copy and a focused
CI browser entry. Core/tests live in src/features/png-compression; no registry,
route, package, shared multi-file input or deployment changes. Existing generic
image compressor still has its own resizing policy and requires a separate task.

Owner paused Web/URL conversion on 2026-10-14. Keep existing local HTML tools;
do not extend URL renderer/backend, custom fonts or HTML/PDF features during sync.

## Multi-file drag/drop adaptation after PR #24

PNG correction above merged in Orvulix PR #24 (097d594). The earlier candidate
snapshot remains historical. Multi-file drop is now implemented on
feature/upstream-multifile-drop from that develop baseline, not yet merged.
Source #458 / b2e6f0b remains merged upstream; no whole-PR cherry-pick.

Four existing shared adapters use src/features/multifile-drop for picker/drop
validation, nested file-drag state and serial transactional import. Every batch
is atomic: invalid selection, budget or preparation failure adds none of that
batch and displays an error; previously accepted batches remain. Duplicates are
retained intentionally for repeated frames/slides. Orders append after the maximum
existing order (not list length); removing a file cannot introduce collisions.
The inputs do not add reorder UI; existing list order/consumer behavior is retained.

Admission budgets include queued reservations: image 20 files, 16 MiB/file,
64 MiB combined; PDF 20, 32/128 MiB; audio/video 10, 64/128 MiB. Converted image
bytes are checked again before publication. Native image metadata rejects invalid
images or geometry above 8192px/side and 16M pixels. PNG/JPEG/GIF/WebP/SVG/AVIF and
other accepted native formats retain their paths; HEIC/HEIF is converted through
the existing library lazily rather than introducing another decoder. PDF uses
existing pdf-lib validation before passing input to auto-conversion. MIME/extension
matching is only a selection hint, never content/security proof; known extensions
can match empty MIME, but an incompatible explicit MIME is rejected unless the
consumer explicitly accepts that extension.

Metadata/async preparation waits are bounded at 15 seconds. Clear/reset/unmount
aborts cooperative waits, invalidates queued work and ignores late results/errors.
Managed preview/probe URLs, event handlers and readiness timers are reclaimed.
Native decoding and synchronous HEIC/pdf-lib work have no hard CPU/memory quota
or preemption; byte/count limits do not prevent all decompression allocations.
Audio/video import has no native decode requirement, preserving FFmpeg formats
unsupported by native playback. Codec errors/output lifecycle in existing tool
services are separate, unchanged behavior; importer cancellation does not cancel
an already started tool conversion. This task does not claim to fix that boundary.

Drop handlers are zone-local and apply to file drags; text/links outside/within
the zone are not hijacked. Directory entries and empty file drops are rejected.
Keyboard/mobile use the existing picker. Accessible image removal replaces the
clickable-only cross with an IconButton; region, status and error UI use MUI theme.

Validation requires the four actual inputs plus real exported PDF/WAV/MP4 decoding.
The media browser fixtures use installed @ffmpeg/core 0.12.10 WASM served to the
existing 0.12.6 CDN request through the test route; conversions are genuine, but
this does not validate production CDN availability/version delivery. MP4 output is decoded using a second genuine WASM engine via test-only local
assets when native H.264 support is unavailable; these assets are not shipped in
Pages output. Tiny local red/blue MP4 fixtures were generated with FFmpeg; no external user data is used.

Sync hotspots: four ToolMultiple*Input adapters, four English status strings,
one focused CI entry and PDF-baseline browser assertions adapted to earlier
import rejection and explicit filename-filtered downloads/readiness; existing
output assertions remain. Isolated core/hook/status/tests. No runtime dependency,
registry, SEO/routing, Netlify or production deployment changes. Future tasks need
explicit scope for conversion job cancellation, GIF timing/quality or backend URL
rendering; Web/URL conversion remains paused.
