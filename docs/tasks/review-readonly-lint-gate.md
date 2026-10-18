# Task checkpoint: review-readonly-lint-gate

- Branch/base: feature/review-readonly-lint-gate / develop b7bf878f
- Phase: developing; PR pending; develop-merge; user requested R14 among all fixes.

Review snapshot had 270 errors/26 warnings; current explicit read-only baseline
has 265/25 at this base, including 136 errors in checked-in Emscripten generated
gs-worker.js. Other prepared slices remove some baseline diagnostics; merge them
before final enforcement rather than editing their files twice.

Acceptance: lint/check is read-only, lint:fix is explicit, full application lint
passes with max-warnings=0 and CI checks it for main/develop PRs. Preserve existing
rule severities, security gates and tests. Exclude only the exact generated codec
artifact with documented provenance/hash and runtime/build validation, no blanket
application ignore or broad rule disabling. Fix unused imports/locals, formatting,
types and hook dependency issues without introducing recompute loops/stale closures.

Use the existing debounce hook for real consumers, with stable identity, latest
callback and pending timer cleanup. Preserve each delay and native lodash return
behavior; cancellation does not claim to stop in-flight promises/codecs. Remove
unused broken useUpdateEffect export only after caller search confirms no consumers.
Target only files with current diagnostics; inspect the entire resulting diff.

Checks: before/after read-only lint report and Git content identity, focused hook/
UI/resource tests, full unit/type/build/security, actual affected browser flows
(WebP/JPG/QR/text compare/multifile), two review passes and exact-head CI. No new
runtime dependency, production hosting or security exception change.
