# Task checkpoint: sdlc-task-loop

- Updated: 2026-10-14, Asia/Bangkok
- Branch / base: feature/sdlc-task-loop / develop
- PR: https://github.com/nguyenan97/orvulix-web/pull/23
- Phase: CI
- Delivery mode: develop-merge
- User authorization: configure the SDLC loop and merge this completed scoped task
  into develop. PR22 is unrelated and remains open; no production release.
- Last verified base: 2ac35d2d7b373eda8e9841a1e2a3c50570943e12
- Last reviewed commit: 36de6eeca03d53588af03c251dd821c1ad7339c6
- Snapshot changes since review: only this checkpoint's PR/status/evidence fields.
  Resolve the actual latest head from Git/PR; this document is not exact-head CI proof.

## Scope and acceptance

Make one-task/one-PR dev/test/review/CI delivery and develop merge explicit, with
resume checkpoints. Preserve explicit PR-only/review-only constraints, independent
approval requirements, main/production restrictions and safe cleanup. State that
repository instructions cannot inspect quota or automatically wake after reset.
No application/runtime/hosting changes or automatic backlog runner.

## Completed and pending

Written and reviewed the lifecycle/merge gates, checkpoint schema and interruption
policy. References/skill metadata, text-style and whitespace checks passed; the
scoped draft PR is open. No task-blocking finding identified in the instructions.
Pending: latest-head CI, then authorized develop merge and safe branch cleanup.

## Validation and review

Documentation-only change; no new runtime tests required. Existing CI runs its
unit/browser/build/security checks; pending is not passed. References/metadata were
validated with Python, node scripts/check-text-style.mjs and git diff --check pass.
Develop rules currently forbid deletion/non-fast-forward; do not bypass any rules
added later. Recheck actual Git/PR/head/base/CI and approvals before merging.
public/sitemap.xml remains untracked user work and must not be staged or changed.

## Resume point

Continue PR23 on feature/sdlc-task-loop: inspect exact-head CI and fix task failures
on the same branch. Once all gates pass, merge the matched head into develop and
verify/clean up only this branch. If PR23 is already merged, reconcile this older
checkpoint with GitHub and do not recreate the task. No owned server remains.
Preserve PR22/feature/web-conversion-ux and public/sitemap.xml.
