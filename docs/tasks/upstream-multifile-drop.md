# Task checkpoint: upstream-multifile-drop

- Updated: 2026-10-14 UTC
- Branch / base: feature/upstream-multifile-drop / develop
- PR: not opened yet
- Phase: reviewed; exact-head CI pending
- Delivery mode: develop-merge, explicitly requested by owner
- Last verified base: 097d5941f3cdf8ba14df3f3629d709b5d703d320 (PR #24 merged)
- Implementation commit: e8817ec8a81c9e9ea63f1d0fbbd8bb9d99d0927a; this checkpoint
  and the expected-filename baseline helper refinement follow it.
- User work: preserve untracked public/sitemap.xml; do not stage it.

## Scope and acceptance

Adapt upstream #458 (implementation b2e6f0b, merge f311ce9) into four shared
image/audio/video/PDF inputs. One picker/drop pipeline, atomic batch rejection,
sequential imports with reserved pending budgets, unique order values and preview
ownership. Keep duplicate files deliberately (slides/frames may repeat). Image:
20 files, 16 MiB/file, 64 MiB total; PDF: 20, 32/128 MiB; audio/video: 10, 64/128 MiB.
Image metadata readiness must fail/recover within a bounded wait; HEIC conversion
is lazy and cooperative cancellation cannot preempt synchronous native decoding.
Clear/reset/unmount invalidates work and late publication. No tool conversion
service changes, directory/framework/dependency migration or deployment changes.
Web/URL conversion remains paused.

## Discovery

No local drop handlers. Image Promise.all captures old value across async HEIC
work; audio/video/PDF assign the same order to each batch item. Image preview URLs
are not reclaimed on external reset/unmount. Shared consumers: GIF, Images to PDF,
image resize/compress/watermark, JPG/WebP conversions, merge audio/video/PDF.
No native metadata decoder exists in audio/video inputs; preserve FFmpeg format
support rather than rejecting codecs the browser cannot play. PDF import can
validate with existing pdf-lib before publishing to its auto-conversion consumer.

## Completed / validation

Implemented isolated policy, serial ImportSession, abortable preparation/hook and
MUI status overlay; four existing input adapters and relevant English strings.
Atomic rejection/unique ordering/URL ownership tested. Typecheck passed; focused
21 unit tests passed; full unit suite passed 1153 tests /129 files. Production
build passed 157 route/sitemap entries and 404; bounded worker audit unchanged.
Security tests/check passed (15 package findings, six advisory IDs, existing
braces exception unchanged). Text-style and diff whitespace passed.

15 native browser cases passed across Chromium/Firefox/WebKit with real PDF/WAV/
MP4 output. PDF tests now assert earlier importer errors and no partial admission;
filename-filtered explicit download events avoid native iframe auto-downloads.
Added actual output-control readiness without changing timeout/retry settings.
Final combined run: 38/39, with Split Image to Pages WebKit readiness timing out.
That unchanged-service case passed alone in 14 seconds. Entire PNG/PDF baseline
then passed 24/24 in a fresh process across all three engines, preserving all
assertions and timeouts/retries. Multi-file 15/15 passed, including all its cases
in the combined run. Do not claim the combined run was 39/39 or a proven OOM
root cause; record the observed suite-isolation limit in PR metadata.
Pages build/smoke passed prefix/noindex/no canonical and picker/drop to actual
two-page PDF, clear and PDF reimport. Test-only WASM decode fixtures do not ship
in Pages output. Full-diff self-review found no scoped correctness blocker after
these corrections; limitations are in UPSTREAM_SYNC.md. Self-review is not an
independent approval.

## Pending / resume

Local acceptance/review done; commit remaining scoped test/docs refinements,
push one PR develop, exact-head CI, authorized merge/cleanup. Dev server 5173,
Pages host 4188 and owned browser runs have stopped. Preserve untracked public/sitemap.xml with
checksum 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.
This snapshot precedes CI/merge; resolve final head/state through Git/PR metadata.
