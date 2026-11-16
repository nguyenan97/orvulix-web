# Task checkpoint: file-checksum

- Updated: 2026-10-19 Asia/Bangkok
- Branch/base: feature/file-checksum / develop a9609e54
- PR: https://github.com/nguyenan97/orvulix-web/pull/56
- Phase: reviewed / CI
- Delivery mode: develop-merge
- Authorization: user delegates feature choice and implementation; current task only.
- Last verified implementation head: e00df15; base a9609e54. Only this checkpoint
  update is uncommitted; implementation has been pushed.

## Scope and acceptance

Implement backlog item 3. [Contracts and A1-A6](../FILE_CHECKSUM.md) own scope,
acceptance, limits and design. Risk: file/worker resource boundary. No dependency,
backend, paid API, production hosting or unrelated consumer changes.

## Discovery

Develop fast-forwarded, no open task PR, clean tree. Text Workflow and Docker
already exist. Registry/code search found no file checksum tool. Upstream #114
is open and current upstream PR list has no checksum implementation.

## Validation and review

Implementation complete: isolated hash/domain/worker/runner/UI, thin string tool
adapter, English metadata, discovery test, SEO and roadmap status, CI native check.
Tests were added after initial implementation; no red-first product regression
claim. No runtime dependency changes.

Local evidence for this tree:
- Typecheck and read-only ESLint passed again after final browser-test edits;
  focused DOM suite also passed after its final extra test case.
- Full suite: 179 files / 1730 tests passed. Subsequently added one algorithm
  cancellation case; focused Calculator suite 8/8 passed. Latest-head CI must
  validate the complete updated suite.
- Production build: 160 indexable routes, sitemap/404 validation passed.
- Pages build: 161 HTML files validated under /orvulix-web/ with noindex.
- Pages browser run with retries=0: 7 passed on Chromium/Firefox/WebKit;
  2 native clipboard readback cases intentionally Chromium-only. Real worker
  empty/abc/binary hashing, comparisons, algorithm/file edits, cancellation and
  recovery passed. Missing clipboard guidance passed on all three engines.
  Chromium native clipboard readback, keyboard and 390px overflow checks passed;
  mobile screenshot visually inspected, no clipping found.
- Audit gate passed: 15 package findings / 6 advisories, existing exact temporary
  exception retained; zero unaccepted high/critical. Security tests 26/26 passed.
- Text style/diff whitespace checks passed before staging; rerun before commit.

Harness corrections: initial browser command accidentally rebuilt and hit the
existing server-start deadline; corrected to existing builds. Pages output needs
a prefix-aware preview, now verified using an ignored local config on port 4174.
Cancel test first clicked before React's disabled button update, then interception
hit a cancelled route; final test awaits React's commit microtask before the next
worker task and uses the actual native worker, without sleeps/retries/threshold
changes. Roadmap's stale Planned assertion now checks the implemented MVP while
keeping the next milestone Planned. No runtime fix was needed for those harness
failures.

Review passes against base a9609e54 and full feature tree:
- Requirements: A1-A6 mapped to vectors, DOM ownership/admission and actual browser
  flows/builds. Size cap before read, no uploads/storage/new dependencies. Current
  expected value is revalidated immediately; current run only publishes/copies.
- Standards/security: React text sinks, lazy route, worker error/message validation,
  termination/listener/timer cleanup, unmount epochs, clipboard notification epoch,
  labels and responsive wrapping checked. MUI/React18 retained; SSR/Next suggestions
  do not apply. No task-blocking finding identified. This is self-review.
- Live develop rules require build/secret-scan/dependency-audit/codeql and resolved
  threads; approving review count is 0. No protections/bypasses changed.

## Resume point

PR56 is draft. Commit this checkpoint, mark ready, inspect exact latest-head CI
and CodeQL findings, fetch develop, matched-head merge and safe cleanup. Prior
local build/native evidence applies to the unchanged runtime at e00df15; CI must
match the new documentation head. Full staged diff reviewed before e00df15 and
again after hooks; no task-blocking issue found. Dev server session 59185 owns
localhost:5173 until cleanup; browser previews already stopped. Production
release remains outside scope.
