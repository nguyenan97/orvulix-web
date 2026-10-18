# Task checkpoint: review-string-regex-isolation

- Branch/base: feature/review-string-regex-isolation / develop f6fe6902
- Phase: developing; PR pending; develop-merge; user requested R08 among all fixes.

Replacer/Split/Palindrome execute arbitrary regex on the UI thread. Existing list
and assistant workers do not cover these routes. Native review measured a 26-char
catastrophic expression blocking the main thread for about 1571ms.

AC1: these routes compile/execute user regex only in a disposable worker. 2s
deadline includes startup; input/options change, empty input and unmount terminate
obsolete workers, hide old output/errors and allow valid recovery.
AC2: preserve existing literal/regex replacement flags/captures/$ substitutions,
split modes and palindrome output semantics for admitted input. Syntax/resource
errors are visible and disable exports. Long palindromes use iteration.
AC3: 64 Ki UTF-16 input units, 1024-unit pattern/options (replacement 4096),
20000-part admission and 1 Mi output units. Conservative preflight includes captures
and replacement prefix/suffix expansion before native allocation; some configurations
with large potential output are rejected even if actual matches would be sparse.
These are not hard memory/CPU quotas. No main-thread regex fallback.
AC4: real catastrophic jobs settle by engine completion or deadline while UI stays
responsive. A deliberately stuck worker must time out; valid results/downloads and
cancellation recover with no live workers left.

Boundary: Formik/current input -> cheap static admission -> per-job worker ->
existing pure services -> bounded text output. Keep upstream route options/examples,
no dependency/network/hosting change. Next: focused regressions and native flows.

Prepared checkpoint: 25 new kernel/runner/current-result tests pass, and 45 tests
including inherited services pass. Native replacement capture/flag/$ substitutions,
split modes and long iterative palindrome are covered; parent never constructs a
user RegExp. Static admission may conservatively reject sparse-match potential
expansion; this is explicitly displayed. No blacklist or synchronous fallback.

Build/typecheck (159 routes plus 404), scoped read-only ESLint/style, 26 security
tests and unchanged audit gate pass. A test instrumentation Window cast initially
failed typecheck, corrected to an explicit test-only probe type.
Native three-tool downloads, actual regex attacks, deterministic stuck worker
deadline/heartbeat, Clear and SPA navigation pass all engines 9/9, zero retries
(r08-browser.json). WebKit finishes the actual attack with the correct no-match
result before deadline. Initial timeout-only assertion wrongly assumed all engines
backtrack identically; aligned with existing list/assistant suites and retained a
strict timeout/heartbeat assertion using a genuinely busy native worker fixture.
Actual native regex output and worker termination are still asserted separately.

Two-pass review: preserve existing service APIs/text download representation;
current input/options gate publication, abort every obsolete worker, and bound
potential capture/replacement expansion before execution. No blocking finding.
Still required: full local unit suite, latest develop integration after prepared
R07 delivery, affected checks and exact-head CI/merge/cleanup. Next save this slice,
deliver Ghostscript on current PDF base, then resume full validation here.
