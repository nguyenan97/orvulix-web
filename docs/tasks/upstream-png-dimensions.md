# Task checkpoint: upstream-png-dimensions

- Updated: 2026-10-14, Asia/Bangkok
- Branch / base: feature/upstream-png-dimensions / develop
- PR: #24, https://github.com/nguyenan97/orvulix-web/pull/24
- Phase: ready for review; exact-head CI pending
- Delivery mode: develop-merge per owner's upstream sync request
- Last verified base: a32c133f9bab589a856c638866df8f67da79c00c
- Upstream: cf41a30; common history 3bbca2f; provenance #461 / 1fe23b4
- Implementation committed: 59e8d6747fbe6c12f9aa7d1d770e05f0f92da1d5.
- This documentation checkpoint follows that commit; resolve latest head via Git/PR.
- Unrelated user work: public/sitemap.xml remains untracked and unchanged.

## Scope and acceptance

Selectively adapt upstream PNG dimension/non-inflation intent, retaining existing
library/one-file UI. Preserve native dimensions, alpha for deterministic supported
fixtures, filenames, bounded static input and newest-job output. Do not claim
lossless compression or import the full custom encoder/batch interface. Web/URL
conversion remains paused. No package, routes, Netlify or production changes.

## Completed and pending

Compared actual upstream main/develop and candidates; baseline Chromium proved
1600x100 -> 1024x64 regression. Implemented module/API option correction, preflight,
self-hosted worker script and UI abort/stale/error handling. Focused 9 unit tests
and typecheck pass. Full unit suite passed 1132 tests in 126 files; after the
additional active-unmount assertion, focused 9 unit tests passed again. Native
Chromium/Firefox/WebKit checks passed 9 tests. Production build validated 157
routes/sitemap URLs plus 404. Pages build validated 158 dev HTML files; Pages
smoke decoded 1600x100 PNG (875 -> 158 bytes), alpha/edge pixels and Unicode
filename; both compression assets returned 200 under /orvulix-web/. Security
tests/check and text-style/whitespace checks passed. See UPSTREAM_SYNC.md for
intentional divergence and implementation limits (including native preview and
library main-thread fallback). No exact-head CI result is claimed yet.

Full-diff self-review found no remaining scoped blocker. Initial CodeQL reported
one test-only URL-substring finding; changed the observer to exact URL.hostname
comparison and asset checks to cover both emitted compression files. Refined browser tests passed
9/9 across all three engines; final production build passed 157 routes plus 404.
Exact-head CodeQL must be rechecked after committing this refinement. Existing shared preview
preflight/main-thread fallback and non-lossless limits remain explicitly documented.
PR #24 is open/ready and targets develop. Pending: exact latest-head CI (including
full unit suite after the additional unmount assertion); authorized merge and
cleanup. Use PR/run metadata for final CI/merge state, not this pre-CI snapshot. Preserve public/sitemap.xml with original checksum
5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Resume point

Inspect Git/PR/CI, reconcile this snapshot and stay on the current feature branch.
Do not push upstream, recreate completed tasks or merge the entire upstream tree.
A local dev server is owned by this session; stop only owned resources at delivery.
