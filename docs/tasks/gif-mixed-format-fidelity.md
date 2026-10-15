# Task checkpoint: gif-mixed-format-fidelity

- Updated: 2026-10-15 UTC
- Branch / base: feature/gif-mixed-format-fidelity / develop 4a8489c
- PR: not opened
- Phase: validating (implementation uncommitted)
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
homogeneous timing unchanged. Focused tests: 53 passed before final cumulative
decoded-pixel refinement; full suite, build and native browsers running.
Security tests/check pass with unchanged 15 package findings/six advisories,
zero unaccepted high/critical and one existing braces exception.
See GIF_MIXED_FORMAT.md for exact policy/budgets and no hard quota claims.
Owned dev server: 5173. Validation/PR/exact-head CI/merge/cleanup pending.
