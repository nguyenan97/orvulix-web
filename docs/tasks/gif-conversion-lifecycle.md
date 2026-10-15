# Task checkpoint: gif-conversion-lifecycle

- Updated: 2026-10-15, Asia/Bangkok
- Branch/base: feature/gif-conversion-lifecycle / develop
- PR: not opened; resolve from feature head when resuming
- Phase: validating
- Delivery mode: develop-merge, explicitly requested by owner
- Base: d96ab5b07fd3d4cdf79a9fa820298693516d085e
- Preserve untracked public/sitemap.xml; never stage it.

## Scope / acceptance

Images to GIF only: clear/reset/edits invalidate output immediately, before the
unchanged 1000ms debounce; latest snapshot alone can publish result/error/loading.
Cancel debounce on unmount. Optional AbortSignal for shared FFmpeg task admission
and queued callback; GIF cooperatively checks between fetch/write/exec/read. Never
reset/terminate the shared worker. Existing no-signal callers retain behavior and
temporary-file cleanup. Keep encoding/FPS/delay/filename semantics unchanged.
No other converters, dependency/hosting/Netlify changes or Web/URL conversion.

## Evidence / status

Prior browser reproduction: two PNGs, wait active conversion then Clear; zero input
files but downloadable 32x32 GIF returned (three frames). Clear before debounce did
not reproduce the bug. Reconfirm baseline on unchanged built runtime before tests.
Implementation uncommitted: isolated latest-job/hook, GIF UI/service and optional
queue signal including cancellation during cleanup. Focused 20 unit tests pass.
Initial full run had an unrelated i18n bootstrap timer in UI cleanup assertions;
UI tests now isolate i18n bootstrap while retaining timer/resource assertions.
Full suite rerun passes 1173 tests / 132 files, including cleanup-boundary coverage. Initial browser run: 23/24; Firefox navigation assertion
started before asset load reached EXEC. It now waits actual EXEC-start before the
unchanged URL assertion. Final native rerun pending. PNG/multi-file regression: 23/24 passed; Firefox
image-to-PDF flow failed during page.goto with Download is starting, not a GIF
assertion. Diagnose in isolation without weakening assertions or timeouts.
Typecheck passes after the final cleanup-boundary refinement. Final production
build/browser run is in progress. Security tests (26) and check pass: 15 package
findings / six advisory IDs, zero unaccepted high/critical and one existing braces
exception; no dependency/security disposition changed.
Baseline homogeneous PNG/JPEG timing recorded; mixed-format fidelity is separate.
See GIF_CONVERSION_LIFECYCLE.md. PR/exact-head CI/merge/cleanup pending.
Active encoding cannot be preempted: cancellation discards output and cleans up
at supported boundaries. No hard CPU/memory quota or production CDN proof claimed.

## Resume

Check status/PR first; finish tests and validation. Owned dev server at 5173 and auto-managed preview test runs at 4173;
stop only owned resources. Baseline preview has stopped. Pages deployment after PR25 timed out despite successful
build; do not retry deployment or change configuration under this task.
