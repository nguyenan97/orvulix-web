# Task checkpoint: data-transfer-time

- Updated: 2026-10-19 Asia/Bangkok
- Branch/base: feature/data-transfer-time / develop 7718068c
- PR: not opened
- Phase: reviewed / preparing draft PR
- Delivery mode: develop-merge
- Authorization: user requests prompt and execution; feature choice delegated in chat.
- Verified base clean; feature docs and implementation below are uncommitted.

## Scope and acceptance

[Execution prompt/contracts](../DATA_TRANSFER_TIME.md) own A1-A6, field limits,
units and output semantics. Risk: bounded arithmetic/UI behavior. No dependency,
network/persistence/file/worker boundary change. Existing CI security gates apply;
auth/container/renderer/codec controls are N/A. CI gets one focused browser spec.

## Discovery/design

Checksum PR56 merged. No open task PR, develop up to date. No transfer estimator
in current feature/generic calculator code; Byte Converter remains separate.
Upstream #80 open, no current open PR title indicating this feature. Pure bounded
calculation and derived output chosen; no async ownership or worker required.

## Validation/review

Implemented isolated arithmetic/validation/formatting and live React form, thin
number route/registry/English locale, SEO/search and roadmap integration. No
shared calculator changes or runtime dependency. UI result derives synchronously
from the current form; no async job or stale cached output.

TDD evidence: ideal 1 GB/100 Mb/s passed; efficiency case initially failed with
80 seconds instead of 100 at 80%, then passed after rate adjustment. Extended
boundary tests reproduced optional whitespace bypassing the 32-character limit;
fixed before trimming. Focused tests: 5 files / 64 passed.

Production build passed after correcting a Testing Library option type in one
test: 161 indexable routes, sitemap and 404 validation. Read-only lint passed;
full build includes successful TypeScript compilation. Audit gate passed with
15 package findings / 6 advisories, existing exact temporary exception unchanged;
26 security tests passed. Text style/diff whitespace checks passed so far.

Initial full suite: 177 files / 1771 tests passed, five SEO tests hit unchanged
5-second deadlines while builds/typechecks ran concurrently. That result is not
passed evidence. Isolated rerun passed 181 files / 1776 tests with no changes to
retries/timeouts/assertions/worker settings. This supports contention as a cause
without proving the exact scheduler/resource mechanism.

Native production: 6/6 passed across Chromium/Firefox/WebKit, retries=0. Pages
build: 162 HTML files validated under /orvulix-web/; prefixed browser run also
6/6 passed across those engines with noindex assertion. Tests cover unit choices,
efficiency, invalid input/recovery, zero/subsecond transfer, example/reset, keyboard
and 390px overflow. Updated screenshot framing only after production run; final
Pages run captures the entire isolated calculator and was visually inspected.
Labels, selected units, result and notes wrap within the narrow layout. These
tests do not claim network performance measurement or unrelated UI coverage.

Full-diff review against develop 7718068c, refetched unchanged before commit:
- Requirements: A1-A6 mapped to literal conversions, all 18 unit factors, numeric
  bounds, format boundaries, current-input DOM flows and real browser/build
  evidence. Default efficiency, decimal/binary and bit/byte meanings are explicit.
- Standards/security: pure feature-local rules, one form state and derived output,
  no effect/async/worker/storage/network sink, bounded strings before regex/trim,
  React text rendering, stable option keys and accessible field errors. Existing
  React18/MUI retained; SSR/Next suggestions in React skill do not apply.
- Added only one spec to the existing focused CI step. Dependency/scanner settings,
  exceptions and protections are unchanged. Live develop rules require build,
  secret-scan/dependency-audit/codeql and resolved threads, 0 approving reviews.
No task-blocking finding identified. These review passes are self-review.

## Resume point

Local validation complete. Commit scoped staged files and this checkpoint, open
one draft PR into develop and mark ready after final remote diff check. Record
PR/SHA and exact-head CI evidence in PR metadata, inspect CodeQL results, refetch
develop and matched-head merge only after gates pass. Then verify ancestry/head
and safely clean up only this task branch. Dev server, unit and browser-owned
previews have stopped. Production release remains outside scope.
