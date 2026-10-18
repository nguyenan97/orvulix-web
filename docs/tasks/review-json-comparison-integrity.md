# Task checkpoint: review-json-comparison-integrity

- Updated: 2026-10-18, Asia/Bangkok
- Branch / base: feature/review-json-comparison-integrity / develop 22e2a097
- PR: pending
- Phase: reviewing
- Delivery mode: develop-merge
- Authorization: fix review R03; owner explicitly retains trailing-comma compatibility.

## Scope / contract

Preserve strict JSON values and trailing commas only. A string-aware lexical pass
may remove commas immediately before a container closes after a value; JSON.parse
still validates grammar. Do not broaden to comments, unquoted keys or missing
array values. Existing JSON budgets bound parse/depth/output before rendering.
Compare primitive/type/container/own keys recursively, including JSON output
mode. Retain familiar dot paths; quote unsafe keys to avoid path collisions.

- AC1: x,} and x} strings differ; escaped strings and trailing commas round-trip.
- AC2: root/null/array/object types and deep values compare correctly in both modes.
- AC3: own prototype-named keys survive, distinct source paths cannot overwrite
  each other; malformed/oversized/deep input errors and valid recovery work.
- AC4: production UI/native downloaded result represents current comparisons.

Risk: untrusted text -> bounded parser/recursion -> inert result/export. No new
dependency, pattern execution, logs or network transport. Preserve numeric
precision semantics of JSON.parse; do not claim arbitrary precision comparison.

## Resume

Baseline added tests exposed nine failures: string corruption, root-type false
negatives, shallow JSON output, lost own prototype key and missing admission.
All 21 comparison tests plus 5 existing budget tests pass after correction.
Production build/typecheck, scoped read-only ESLint/style, 26 security tests and
unchanged dependency gate pass. Actual current text download/invalid recovery and
root/trailing-comma UI flows pass 3/3 Chromium/Firefox/WebKit, retries zero.
Evidence r03-browser.json outside repo. FileReader import is real; this flow does
not claim a new Monaco keyboard/clipboard regression check.

Two-pass self-review: no quoted string rewriting, no missing-value repair,
untrusted regex/eval or prototype lookup; own-key result dictionary has no
prototype. Input/depth/token and retained/final output are bounded. Keep native
JSON.parse number semantics, not arbitrary precision. No task-blocking finding
remains. Self-review is not independent approval.

Next: commit prepared slice; deliver R02 first, then merge current develop into
this branch, resolve the independent Pages test entry and run affected checks.
Open one PR and require exact-head full CI before develop merge. No prod release.
