# Task checkpoint: review-async-tool-errors

- Branch/base: feature/review-async-tool-errors / develop b368b48d
- Phase: reviewing; delivery mode develop-merge; PR pending.
- Scope: review R12, user requested all confirmed fixes.

ToolContent catches synchronous throws only. Observe returned promises and report
current failures through the existing snackbar. Input/option changes and unmount
invalidate error ownership; an old rejection must remain consumed but silent.
Do not retry jobs or claim generic cancellation of services that lack abort APIs.

AC1: sync throw and async rejection report one current error without pageerror.
AC2: old input/option rejection and post-unmount rejection produce no stale notice.
AC3: existing callbacks still run once per actual input/options change, without a
render/compute feedback loop. Returned values remain ignored.

Boundary: Formik values/input -> existing compute callback -> sync/async outcome
-> current snackbar. No dependency/network/hosting change. Native invalid-image
flow supplements controlled promise lifecycle tests.

Baseline regression produced an unhandled rejection and no notice. Six focused
tests now pass: current async/sync errors, input/options invalidation, unmount,
successful retry, callback identity and non-Error rejection fallback. Full unit
suite passes 162 files/1562 tests (local maxWorkers=4, 91.42s), without test deadline,
retry or CI changes. Build/typecheck (159 routes and 404), scoped read-only ESLint,
style, 26 security tests and unchanged audit gate pass. A test-only Mock return
type initially failed typecheck; corrected to the actual callable context type.

Native invalid HEIC processing reports a snackbar with no pageerror on Chromium,
Firefox/WebKit, 3/3 zero retries (r12-browser.json). It does not need a model fetch.
After reload the second invalid file also reports; controlled tests cover successful
retry. First WebKit run saw unrelated icon CDN CORS errors. Final test fixtures
only icon endpoint responses, retains actual file processing and zero-error assertion.

Two full-diff review passes found no blocker: latest callback ref avoids a feedback
loop; cleanup gates errors without suppressing rejection consumption; no processing
cancellation promise. ADR docs/decisions/tool-compute-errors.md. Self-review is not
independent approval. Next: integrate latest develop after R04/R11 delivery, validate
shared-contract interactions, exact-head CI then matched-head merge/cleanup.
