# Task checkpoint: PDF merge lifecycle

- Updated: 2026-10-15 UTC
- Branch/base: feature/pdf-merge-lifecycle / develop fd1214d
- PR: not opened
- Phase: developing, uncommitted changes
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
404 validation. Full units and 18 native cases across three engines are running.
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

Pending: expand lifecycle and actual PDF tests, three-engine browser flows with
real outputs, full units/typecheck/build/security/style, Pages regression where
appropriate, review both axes, one PR/exact-head CI, matched-head merge/cleanup.
No owned server. Reconcile live Git/PR state before resuming. Rollback core and
merge adapters to restore prior behavior; no shared UI or hosting changes.
