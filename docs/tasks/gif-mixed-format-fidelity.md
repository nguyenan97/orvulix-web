# Task checkpoint: gif-mixed-format-fidelity

- Updated: 2026-10-15 UTC
- Branch / base: feature/gif-mixed-format-fidelity / develop 4a8489c
- PR: #27, https://github.com/nguyenan97/orvulix-web/pull/27
- Verified runtime: 1f72fdd6a22952c3be1f335bb1231914a9927d2e; completion update changes test readiness/coverage and docs only
- Phase: self-review complete; awaiting final-head CI / authorized develop merge
- Delivery mode: develop-merge, explicitly requested
- User file: public/sitemap.xml remains untracked; preserve checksum
  5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and acceptance

Mixed PNG/JPEG content and order must survive actual GIF export. Keep homogeneous
encoding/timing/frame counts, debounce and PR26 lifecycle. No other converters,
new dependencies, Netlify/production change or Web/URL conversion.

Implemented: sequential FFmpeg normalization to uniform RGBA PNG only for mixed
PNG/JPEG, bounded header preflight and pixels/bytes, same decoded dimensions or an
actionable rejection. Real engine verified max_pixels/PNG RGBA output. Existing GIF
palette/transparency behavior is not redesigned. No hard memory/CPU/preemption
claim. Input and normalized temp files owned by existing shared queue finally.

## Evidence / next

Browser baseline at 4a8489c: homogeneous PNG/JPEG pairs produce three frames,
loop 0, delays [12,8,8]cs (FPS10) / [20,20,20]cs (delay200). Both mixed orders
produce only first red frame, delay0. Triple input loses JPEG and incorrectly stretches timing.
Installed real core0.12.10 is routed to unchanged CDN0.12.6 request; not CDN proof.
After implementation, real mixed outputs retain every source color in order;
homogeneous timing unchanged. Focused tests: 53; full suite: 1206 passed / 133 files. Final production build
(typecheck included) validates 157 static routes/sitemap plus 404.
Initial native run identified a test readiness race: URL changed while About
was still suspended/lazy-loading, so going back could retain old inputs. Tests
now wait for the actual About heading, and verify zero files on revisit, without
weakening output assertions or changing timeouts/retries. Full 60-case native
production rerun passed on Chromium/Firefox/WebKit. Additional real-input limits
and odd-geometry cases passed three engines each (66 GIF cases across runs).
Targeted multi-file keyboard/PDF-pixel regression passed all three engines after
anchoring keyboard activation and moving PDF verification to a separate tab; no
converter implementation or assertions changed. Initial CI had 117 passed/two
flaky cases, not a clean 119-case pass. See GIF_MIXED_FORMAT.md for the initial
readiness/preview observations and the dev-only WebKit DOM-replacement failure.
No runtime change after 1f72fdd.
Security tests/check pass with unchanged 15 package findings/six advisories,
zero unaccepted high/critical and one existing braces exception.
Pages build/smoke passed: 158 dev HTML files, prefix/noindex/no canonical and
actual mixed GIF decoded from a prefixed worker. Final production rebuild and
typecheck passed after test refinements. CodeQL initial run 38683599844 has the
same five baseline findings. Full-diff self-review finds no scoped blocker;
final-head CI still pending. See GIF_MIXED_FORMAT.md for policy/budgets/limits.
Owned dev/preview servers 5173/4173 stopped after tests; Pages smoke server 4188
must be stopped at delivery. Preserve the user sitemap checksum. Resolve current
Git/PR/CI before resuming: push the completion update to this same feature branch,
mark PR #27 ready, follow exact latest-head CI/CodeQL and fetch develop. Revalidate
if base changes, then matched-head develop merge only once all gates pass and no
required approval is missing. Verify ancestry/metadata/head and cleanup only this
feature branch; keep main/develop. Git/PR state supersedes this pre-merge snapshot.
No next task, production/hosting change, deploy retry or new dependency authorized.
