# Task checkpoint: review-async-tool-errors

- Branch/base: feature/review-async-tool-errors / develop b368b48d
- Phase: developing; delivery mode develop-merge; PR pending.
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
flow supplements controlled promise lifecycle tests. Next: baseline then implement.
