# Task checkpoint: review-readonly-lint-gate

- Branch/base: feature/review-readonly-lint-gate / develop 226cf0a9
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

Checkpoint: debounce hook owns queued work and preserves return/flush/cancel;
17 inherited route adapters now use it. Focused hook/multifile/service checks pass
93/93 before additional filename coverage; filename controls/Unicode pass 56/56,
and numeric display-unit selection/quantity-kind reset regression passes. Typecheck
and local production build pass (159 routes and 404). Security tests 26/26 and audit
gate pass with the existing exact temporary exception unchanged.

Native JPG artifact pixels/geometry, QR size-change PNG and Text Compare second
input/current HTML download pass 9/9 across Chromium/Firefox/WebKit, zero page
errors. Existing Chromium suites pass 44/46; two URL assertions expected localhost
while the external config used 127.0.0.1. Corrected only the external config host;
both original cases then pass 2/2, unchanged assertions/deadlines/retries. Evidence:
r14-browser-regression.json, r14-browser-host-correction.json, r14-native.json.
The first custom QR probe used an incorrect route; corrected to the route recorded
in sitemap/metadata before rerunning all nine flows. No application change for it.

Targeted import/dead-local/type/format fixes retain behavior. Typecheck caught an
initial automated const/catch edit at the wrong same-name declarations; corrected
to initialize constants at their assignment and keep used catch bindings. Subsequent
typecheck and focused inherited services pass. No broad ESLint autofix was run.
Exact generated codec exclusion removes 136 diagnostics; wrappers remain linted.
Application lint now has only 10 unused imports in the two R08 routes that PR53
already replaces. Integrate that merge before final lint/read-only identity proof.

Review pass 1 inspected the complete cleanup diff, lexical-this deferred fixtures,
numeric effect convergence, latest callbacks and timer ownership. Existing async
codecs are not newly abortable; this task claims cancellation of queued timers only.
Next: finish full unit run, integrate R08/R13 develop, final lint and review, then
one PR with exact-head CI and authorized develop merge/cleanup.

Integrated R08 develop 226cf0a9 with no conflict. All application lint now passes
with zero errors/warnings. Actual npm run lint has identical before/after hashes
over 1282 tracked/unignored files; generated codec canonical hash also matches the
documented baseline (r14-readonly.json). No application rule severity changed.
Combined affected string worker/service suites pass 56/56. Full suite before that
independent worker integration passed 172 files/1682 tests (maxWorkers=4,129.70s).
Final integrated full suite is running; no deadline/retry/CI worker changes.

Review pass 2 confirms each adapter retains its 1000ms delay (crop 2000ms), numeric
state converges and preserves selected display units, lexical-this test fixtures
retain the native receiver, filename control replacement preserves reserved/Unicode
behavior, and dead reorder/validation helpers had no consumers. The old unstyled
range-slider-container class had no CSS/consumer in the repository; removed only
the unused class, preserving inline slider layout. Empty options use explicit
Record<string, never>. Existing CRLF-only JSON validator blob is normalized by
the repository Git/format hooks; no logic change beyond the empty-options type.
Next: await R13 CI/merge, integrate docs-only base, final required CI and cleanup.
