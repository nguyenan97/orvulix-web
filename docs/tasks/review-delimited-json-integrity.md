# Task checkpoint: review-delimited-json-integrity

- Updated: 2026-10-18, Asia/Bangkok
- Branch / base: feature/review-delimited-json-integrity / develop ec6abf15
- PR: pending
- Phase: reviewing
- Delivery mode: develop-merge
- Authorization: fix R04; owner chose strict CSV/TSV rows and duplicate headers.

## Behavioral contract

Parse records across physical lines. Doubled quotes decode once; quoted whitespace,
newlines, numeric identifiers and comment markers remain literal. Dynamic typing
applies only to unquoted values; empty remains empty and unsafe integers stay text.
Preserve unquoted whitespace. Comments only at record starts outside quotes.
Reject missing/extra fields, duplicate headers, misplaced/unclosed quotes.
Empty comment disables comments. Delimiter is one non-newline UTF-16 character;
quote is one distinct character or empty to disable quoting.

AC1: both services retain exact content in regression fixtures and native download.
AC2: strict shape/quote failure has an inline error, empty output, disabled exports,
and valid/empty input recovery without stale output.
AC3: admission caps 1 Mi UTF-16 source units, 20,000 data records, 1,024 columns;
bounded retained/serialized JSON at 2 Mi units, including repeated header cost.
These are conservative acceptance limits, not hard heap/CPU quotas.

Minimal boundary: route -> current Formik result -> shared bounded parser -> JSON
text output. CSV/TSV share the actual duplicated state machine, not a new ETL
framework. Existing service APIs remain thin adapters. Add opt-in text-result
validity to match the existing code-result contract; default other consumers stay
unchanged. No dependency, upload, storage or hosting changes.

## Resume

Baseline 19/19 service regressions failed, then passed with the shared parser.
Expanded parser/derived-result/default clipboard regressions pass 37/37. Includes
option validation, repeated-header output amplification, column/row/source caps,
comments/empty records, strict shape and quote errors, and recovery.

Actual FileReader imports and JSON downloads pass Chromium/Firefox/WebKit 6/6,
zero retries (r04-browser.json outside repository). Initial browser test incorrectly
looked for a nonexistent Clear button; corrected to empty file import, preserving
the empty-input assertion. Both textarea and Monaco paths use native file input.
Build (159 routes plus 404), typecheck, scoped read-only ESLint, 26 security tests,
audit and style checks pass. SEO copy updated to the actual strict parser contract;
the final base-integrated build still needs rerunning after this copy change.

Two review passes: record grammar/typed values/prototype-named headers and output
budgets, then current-input ownership/shared API defaults/download fidelity. No
open blocking finding. Optional disabled flag matches ToolCodeResult; ADR is
docs/decisions/delimited-result-validity.md. Self-review is not independent approval.
Next: deliver prepared R03, merge latest develop into this branch, revalidate the
affected full diff, then push one PR and require final-head CI before merge.
R02 PR46 has merged at b368b48d. R03 branch awaits base integration/delivery.

Base integration checkpoint: merged R02/R09 current develop at b368b48d into
9444e2c and preserved the independent EPUB plus CSV/TSV CI steps. Full local unit
suite passes 163 files / 1584 tests with local maxWorkers=4 (101.35s), without
deadline/retry/CI changes. Final build passes 159 routes plus 404 including updated
SEO content. A prior integrated build hit Windows ENOTEMPTY clearing dist/assets;
rerun after stopping owned preview passed. Interrupted overlapping unit startup
was not counted as passing evidence; the successful full run was sequential.
R03 PR47 merged at ec6abf15. Integrated that base at 273b4ad, retaining all three
focused Pages checks. Combined CSV/TSV/clipboard/JSON regressions pass 58/58.
The source/runtime diff for this slice is unchanged from validated 255b216; base
only changes independent JSON comparison files and additive CI. Full latest-head
CI must validate the final integrated tree. Next: push/open PR, inspect gates,
matched-head merge and branch cleanup when green.
