# Task checkpoint: initial-load-review

- Updated: 2026-10-18 Asia/Bangkok
- Branch/base: feature/initial-load-review / develop at a74c46c0
- PR: https://github.com/nguyenan97/orvulix-web/pull/43 (draft)
- Phase: final validation, report and exact-head CI
- Delivery mode: develop-merge, current review/fixes only; no new feature or prod release.
- Initially clean; no unrelated user changes.

## Acceptance

- AC1: three cold-cache mobile runs each for home, /string/reverse and
  /pdf/split-pdf, production preview, documented network/CPU profile. Capture
  paint/layout/long-task/readiness, request sizes/waterfall and dependency evidence.
- AC2: fix reproduced startup/interaction defects with regression tests, preserve
  lazy tool capabilities and data processing. Compare identical before/after runs.
- AC3: direct URLs, navigation, refresh/back/forward, failure recovery, mobile and
  Pages prefix/noindex/SEO remain correct. No background eager heavy-model loads.
- AC4: typecheck, focused read-only lint/tests, complete required security/build/
  browser CI; full-diff review, matched-head develop merge and safe branch cleanup.

## Discovery/evidence

Stack confirmed React 18, Vite 6, TypeScript, MUI, React Router 6,
Vitest 4 and Playwright 1.55.1 installed. Baseline production build passed;
137 tools, 14 categories, 159 indexable routes at discovery.
Baseline measured with fresh Chromium contexts, 390x844/DPR1/mobile/light/en-US,
CDP cache disabled, CPU4x, 200,000 B/s down/93,750 B/s up/150ms, 3 runs per route,
2s observation after control ready. Median LCP 3880/4984/5920ms (home/reverse/PDF).
Raw traces include requests/initiators/timings/bytes/long tasks/shifts in ignored
output/playwright/baseline.json. Original accumulator sums layout shifts; final
comparison must recompute both phases with metrics.mjs CLS session windows.

Confirmed findings and scoped fixes:
- P1 startup coupling: every direct tool requests all 13 namespaces; unrelated
  held namespace blocks tool. Route element creation instead of calling wrappers;
  subscribe only active tool/SEO namespace. Embed existing English shell strings,
  avoid premature full English fallback chunk on healthy locale requests.
- P2 layout: delayed remote header icon moves #tool by 251px on mobile. Reserve
  responsive decorative area (96px mobile / 250px desktop) before icon arrives.
- P1 recovery: route chunk network failure unmounts application without recovery.
  Add route-scoped boundary, navigation reset and explicit reload action.
- P2 accessibility/theme: mobile menu/theme lack accessible names/keyboard button;
  source also updates theme for system changes despite explicit choice. Add proper
  controls and system listener only when system mode is selected.
- P2 PDF correctness: native export decoded to the expected selected page sizes,
  but clearing input left Download enabled with old content. Invalidate output and
  asynchronous metadata/jobs on clear/replacement/unmount; report parse errors
  through existing snackbar. This fixes the reviewed heavy route, not a new feature.
- P2 startup CPU: homepage metadata resolves 411 unrelated tool keys per rebuild;
  use the same SEO page constructors scoped to the active route, ignore unrelated
  resource-added events and avoid loading tool override registry on non-tool routes.
  A red test observed the 411 keys; scoped metadata is checked against every full
  prerender page in English and non-English formatting modes, including overrides.
- P2 layout: trace attributes ~0.104 CLS to footer at y756 during the 0.8vh loader,
  then moving outside the viewport when content arrives. A held-chunk test reproduced
  footer y756 < viewport844. Reserve one viewport for loading and bookmark geometry.

Historical validation log (superseded by latest checkpoint below):
Four regression tests failed against unchanged baseline dist: blocked namespace,
251px shift, missing recovery alert, inaccessible mobile menu. Theme test's initial
body assertion alone was not a reliable red reproduction; added frame synchronization
for the media-change event rather than claiming that old assertion proved the bug.
Current runtime changes are uncommitted; validation in progress. Full local unit
suite passed 158 files / 1546 tests with --maxWorkers=2 after an earlier contended
build/unit run had 5 failures (3 files); all 21 tests in those 3 files also passed
in isolation. No timeouts/retries/assertions changed. Subsequent PDF changes have
14 focused unit tests passed; latest-head CI must rerun the complete suite.
Read-only lint passed core affected files; rerun after final PDF/test additions.
Security tests 26/26 and audit pass with one unchanged temporary exception.
Native startup/SEO checks 9/9 passed on Chromium before adding two PDF regressions;
Initial 33-case run: 32 passed, WebKit explicit chunk recovery failed. Trace and
isolated probe reproduced persistent failed module preloads on reload, including
HTTP 503 and aborted fetch. A bounded explicit fetch(cache:reload) of that asset
before reload recovered; a plain reload or query navigation did not. Added
own-origin/base/assets JS selection (32 max, 4s deadline) and tests rejecting
remote/credential/query/traversal targets. This executes only on user recovery,
not initial load. New 33-case native run is pending after this fix.
That rerun passed 33/33 on Chromium/Firefox/WebKit with retries disabled.
Final minor runtime changes after that run: stable theme button key (retain keyboard
focus) and native Array.isArray in BaseFileInput, removing a full Lodash import
used only for that predicate (baseline PDF request was ~27 KiB encoded). Rebuild,
run affected native checks and benchmark before claiming final performance.
The final-minor-change native suite passed 18/18 on all engines. An initial after
measurement improved tool requests/bytes/CLS but homepage median LCP 4220ms was
worse than original 3880ms; do not report that iteration as a successful homepage
optimization. It led to the scoped SEO/override and loader fixes above. Raw
output/playwright/after.json is retained as intermediate evidence. Final after
measurement and validation for these last changes are pending.
No heavy codec,
WASM/model loaded on homepage baseline; no speculative codec rechunking performed.

## Resources and next step

Latest runtime commit 752391157eb77c40c9c905eddf0f3a019a6355ca is pushed in PR43.
Final measurement completed without concurrent local tests/build. Comparison and
review in docs/INITIAL_LOAD_REVIEW.md and docs/initial-load-performance.json.
LCP medians before/after: home3880/3808, Reverse4984/3924, PDF5920/4692ms.
CLS medians after: 0.00130/0.00788/0.000008. Home LCP improvement inconclusive;
home blocking median 452/508ms, explicitly not presented as CPU improvement.

Native latest runtime 39-case suite: 38 passed, one WebKit PDF selected-range
mismatch (all3pages rather than1,3). Three isolated traced runs and subsequent
8-case WebKit suite passed. Added range value assertions before/after upload,
keeping exact PDF bytes/page assertions. No runtime speculation, retries or deadline
changes. Final complete suite with assertions passed39/39 across all three engines,
retries0/traceon. No unresolved reproducible task-blocking finding remains.

Production preview and Pages base/noindex/navigation/mobile smokes passed.
Pages build validated160devHTMLfiles. Owned previews28645/57751 stopped.
Production rebuild session55001 passed. PR head7523911 CI unit/build/security/
startup regression, existing full browser step and Pages build all passed.
New docs/test assertions are being committed; measured runtime unchanged.

Read-only ESLint/style/diff checks passed; full-diff self-review and residual owners/
acceptance recorded in report. Latest fetched develop remainsa74c46c0.
No owned dev/preview/browser process remains.
Next: commit/push final evidence, update/ready samePR, inspect exact latest-head CI
and current develop.
Merge matched head only after gates, verify reachability and clean task branch.
No production deploy/scan and no next feature. See report for scoped follow-ups.
