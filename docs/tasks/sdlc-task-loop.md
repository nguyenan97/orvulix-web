# Task checkpoint: sdlc-task-loop

- Updated: 2026-10-14, Asia/Bangkok
- Branch / base: feature/sdlc-task-loop / develop
- PR: not opened yet; resolve the matching branch's PR before resuming
- Phase: validating
- Delivery mode: develop-merge
- User authorization: configure the SDLC loop and merge this completed scoped task
  into develop. PR22 is unrelated and remains open; no production release.
- Last verified base: 2ac35d2d7b373eda8e9841a1e2a3c50570943e12
- Uncommitted work: AGENTS.md, three skill files and docs/tasks checkpoint/template.

## Scope and acceptance

Make one-task/one-PR dev/test/review/CI delivery and develop merge explicit, with
resume checkpoints. Preserve explicit PR-only/review-only constraints, independent
approval requirements, main/production restrictions and safe cleanup. State that
repository instructions cannot inspect quota or automatically wake after reset.
No application/runtime/hosting changes or automatic backlog runner.

## Completed and pending

Written the lifecycle/merge gates, checkpoint schema and interruption policy.
Pending: review for contradictory authorization, validate links/text/diff, scoped
commit/PR, exact-head CI, then authorized develop merge and branch cleanup.

## Validation and review

Documentation-only change; no new runtime tests required. Existing CI may run its
unit/browser/build/security checks. Recheck actual Git/PR/head/CI before merging.
public/sitemap.xml remains untracked user work and must not be staged or changed.

## Resume point

Review the rules and references, run checks, commit/push on feature/sdlc-task-loop
and create its single PR into develop. Preserve PR22/feature/web-conversion-ux.
