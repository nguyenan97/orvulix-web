# Task checkpoint: PDF merge lifecycle

- Updated: 2026-10-15 UTC
- Branch/base: feature/pdf-merge-lifecycle / develop fd1214d
- PR: #29 https://github.com/nguyenan97/orvulix-web/pull/29
- Phase: reviewed/CI; final checkpoint-only changes prepared
- Delivery mode: develop-merge, explicitly authorized for this one task
- Preserve untracked public/sitemap.xml, SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Discovery and scope

PR28 merged, no open PR/task. Candidates: Merge PDF has a reproduced stale result
on Clear; braces latest remains 3.0.3 without a patch; Text Workflow Builder
remains planned (upstream issue341 open). Prefer demonstrated reliability before
new features. Upstream issue39 is closed, confirming tool existence, not lifecycle
correctness. No URL conversion or other backlog task.

Regression at fd1214d: real tool/Formik effects with deferred merge boundary;
Select -> Clear -> resolve old merge publishes merged.pdf instead of empty.
One test failed for that assertion, then passed after ownership integration.
Affected unit tests: 29 passed across lifecycle, actual PDF service and existing
page-range tests. Production build/typecheck passed with 157 routes/sitemap and
404 validation. Full units: 136 files / 1227 passed. Native: 18/18 across three engines,
retries zero. Pages build: 158 dev HTML files; three-engine merge/download/PDF.js
pixel smoke: 3/3 passed. Metadata noindex/no production canonical and prefix pass.
Security gate passed with the existing 15 package findings / 6 advisory IDs.

Acceptance: immediate stale-output invalidation on Clear/input changes, late
success/error/loading cannot overwrite a newer run, unmount aborts safely, current
failures show an actionable inline error and recovery works. Keep automatic merge,
file order, page geometry/content and merged.pdf. Preserve existing tests.

Core in src/features/pdf-merge; small merge page/service integration. Reuse input
limits 20 files/32 MiB each/128 MiB total; add 500 pages, 64 MiB encoded output,
30-second elapsed acceptance checks. Cooperative between awaited operations/pages,
not preemption of pdf-lib/File reads or hard allocation limits. Output-size cap is
post-encoding. No new dependencies or shared generic job framework.

## Validation/review and resume

Reviewed full diff at code SHA 781f2cb against fd1214d in two passes.
Standards: typed core, local integration, cooperative checks and ownership, scoped
imports/dependencies, instructions, security boundaries and preserved user work.
Requirements: reproduced Clear bug fixed, stale success/error/loading/unmount and
recovery covered, actual page order/geometry/pixels preserved. No task blocker
found. Self-review is not independent approval; check live rules before merging.

All local checks above passed; security:test 26 passed, security:check retains
15 package findings / 6 advisory IDs, no exception changes. Text style and full-PR
whitespace check passed. Final documentation changes only, code unchanged after
781f2cb (earlier local code before hook formatting differs only in whitespace).
Exact-head CI remains pending; resolve its run/SHA and flaky/CodeQL summaries in
PR29 before matched-head merge. No owned servers remain after browser cleanup.

Next: commit/push this checkpoint/docs, update PR body, follow latest-head CI,
fetch current develop and revalidate if changed, then merge when gates pass and
cleanup only this task branch. Keep main and untracked public/sitemap.xml.
