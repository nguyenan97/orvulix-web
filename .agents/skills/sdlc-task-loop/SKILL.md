---
name: sdlc-task-loop
description: Complete one scoped development task through requirements, implementation, tests, review, exact-head CI and authorized develop merge, with durable resume checkpoints.
---

# Scope and authorization

Read AGENTS.md, development-workflow and project-communication first. The owner
requested this default workflow on 2026-10-14. For a user-requested implementation
task, deliver one feature branch and one PR into develop, then merge when all gates
below pass. This applies only to the current task, never to other existing PRs or
an autonomous backlog queue. Do not release main, deploy production, change
hosting/protections or add paid services implicitly.

Review-only requests allow review, not implementation/merge. Explicit stop-at-PR,
wait-for-review and no-merge constraints take precedence for that task. Record
the active delivery mode and user constraint in the checkpoint. If independent
approval is required by repository rules, stop blocked until a real approval
arrives; do not self-approve as another identity or bypass protection.

# One-task lifecycle

1. Discover: inspect working tree, current PRs, latest develop, instructions,
   implementation/backlog and relevant issues. Preserve user work. Continue an
   existing task on its existing head; new tasks branch from fast-forwarded develop.
2. Define: write a small scope, user behavior before/after, explicit non-goals,
   acceptance criteria and risk-based validation. Separate implemented/planned
   features. Resolve routine design choices; ask only for essential missing facts.
3. Design: identify the minimal integrations, existing reusable APIs, security
   boundaries, resource budgets and upstream sync hotspots. Keep this repository's
   SPA/stack, SEO/404 and Pages prefix/noindex. No unrelated migrations.
4. Develop: implement cohesive changes on the feature branch. Keep commits scoped
   and save checkpoints after useful steps. Open one draft PR into develop once
   there is a reviewable checkpoint; later iterations update that same PR.
5. Validate: run meaningful regression tests for the changed behavior plus required
   typecheck/unit/build/security/style checks. UI/parser/renderer changes need
   appropriate real-browser flows/output evidence; Pages assets/routing changes
   need a Pages build/smoke. Documentation-only work needs no invented runtime
   tests; the existing CI may still run its suites. Never skip assertions, raise
   retries/deadlines or weaken security gates to make results green.
6. Review: inspect the entire diff as a reviewer against acceptance criteria,
   correctness, security, performance/resources, lifecycle, UX/accessibility,
   integration/dependencies, metadata and maintainability. Name findings with
   source, trigger, impact and correction. Self-review is not independent approval.
7. Iterate: fix findings within scope, return to validation and review. Every new
   code change invalidates affected prior evidence; rerun those checks. Keep the
   same branch/PR. Repeat until criteria are met, not until a convenient stopping
   point. Do not expand scope to unrelated findings; document bounded follow-ups.
8. Deliver: commit/push, update the PR around final behavior and validation, mark
   ready for review, and inspect CI of the exact latest head. Fix task failures on
   the same branch. Existing unaffected evidence may be reused only with its SHA
   and scope identified. CI success alone is not acceptance or zero-risk proof.
9. Merge: apply every gate below, merge the matched head into develop, verify the
   merge commit is reachable from develop, and use development-workflow cleanup.
   Report merged PR/SHA, checks, remaining risks and deleted/retained branches.
   Merging develop can trigger its existing Pages dev workflow; no prod release.

# Merge gates

- The current task's delivery mode permits develop merge; PR is open, targets
  develop and matches the intended feature head. Explicit stop/review constraints
  are not overridden by this skill.
- All defined acceptance criteria are evidenced. Do not mark the task complete
  while its promised feature is stubbed, broken or silently deferred.
- No unresolved task-blocking correctness/security/regression finding remains.
  Scoped non-blocking risks/follow-ups have a concrete disposition, owner and
  acceptance criteria. Never downgrade severity only to justify merging.
- Review the latest full diff, not only the last commit; preserve unrelated user
  work, and verify formatting/security policies. No force-push or bypass.
- The latest head's required CI is complete and green. Only intentional non-gate
  skips such as feature-PR deployment are acceptable; canceled/queued runs are not
  passes. Record run links/SHA. Observe required GitHub reviews/rules.
- Fetch current develop and confirm that validation/review still applies to the
  base. If the base changed materially, merge origin/develop into the feature
  branch and revalidate the affected/full-PR gates. Never silently trust old CI
  after changing the base/head. Use a matched-head merge operation.

# Checkpoint and interruption handling

Create docs/tasks/<task-slug>.md using docs/tasks/_TEMPLATE.md, on the task's branch.
Save durable checkpoints after scope/design, cohesive implementation, validation,
review findings and before long checks/push/merge. Keep them concise; do not paste
the original execution prompt, credentials, user input or sensitive logs.

Record branch/base, PR if known, phase, delivery mode, completed/pending criteria,
validated SHA/tree and commands/results, open findings, owned resources and the
next concrete step. Mark any uncommitted work explicitly. A commit cannot contain
its own SHA: use the prior verified SHA plus changed files, then resolve the current
head from Git/PR when resuming. Do not fabricate exact-head evidence.

Resume by reading the checkpoint, git status/history, remote head/base, PR state
and CI. Reconcile stale checkpoint fields before acting. A PR already merged or
closed must not be recreated blindly. Do not repeat complete unaffected work,
overwrite user edits, stash them away or reset to the recorded SHA.

Codex usage quota/reset is not exposed by this repository. Never estimate a
remaining percentage or promise automatic wake/resume. Keep steps bounded and
checkpoint proactively, because a hard limit can interrupt before cleanup. At a
quota/interruption signal, save when possible, stop launching dependent work and
report the resume point. The owner must restart, or use an available supported
scheduling facility configured separately; no new API billing is implied.

Stop blocked rather than looping blindly when access/quota/infrastructure prevents
progress or the same check fails three times without new evidence. Record attempts,
cause and the next diagnostic step; this is not permission to skip the gate, merge
incomplete work or declare the task done. Do not schedule indefinite sleep/retries.
