---
name: development-workflow
description: Mandatory Git and Netlify workflow for every development, commit, push, PR, and release task in this repository.
---

# Required workflow

1. Read root `AGENTS.md`. Run `git status --short --branch`, inspect the current
   branch and upstream, and preserve existing changes.
2. For new tasks, work on `feature/*` based on `develop`, not directly on `develop`. If on another branch,
   safely move task changes to an allowed branch before editing. Do not discard,
   stash, or commit unrelated user work to make a checkout possible.
3. For a feature branch, start from updated `develop` when the working tree permits:
   `git switch develop`, `git pull --ff-only origin develop`, then
   `git switch -c feature/<task>`.
4. Run `npm run dev` for local development. Run relevant checks and
   `npm run build` locally before a release; use `npm run serve` to inspect the
   built site. Build-generated files must be reviewed before staging.
5. Commit only task files on the allowed branch. Push to the matching remote
   branch. Feature PRs must target `develop`, never `main`.
6. Stop after development delivery. Do not release as an implicit final step.
   Development hosting is GitHub Pages at
   https://nguyenan97.github.io/orvulix-web/, built from `develop`. Feature PRs
   only run checks; merging into `develop` triggers the Pages dev deployment
   when its environment allows `develop`. Preserve dev `noindex` and the
   repository URL prefix. Netlify from `main` is production, not dev hosting.
7. Only when the user explicitly asks to release: review the full `develop` vs
   `main` diff, run appropriate checks and local build, and use a PR from
   `develop` to `main`. Merge only within the user's authorized release scope.
   This can trigger a production deploy costing 15 credits under the current plan.
   Never push directly to `main`, including during a release.
8. After an authorized merge, clean up the completed task branch using the
   checks below. Do not leave merged feature/bug-fix branches indefinitely.

# Post-merge branch cleanup

- This rule authorizes cleanup of the completed task branch after its PR is
  merged; it does not authorize merging a PR or bulk-deleting other branches.
- Always keep `main` and `develop`. Keep protected, release, staging, upstream
  tracking, or other long-lived branches when still needed or explicitly retained.
- Verify the PR state is **merged**, its merge commit is reachable from the
  target branch, and the remote branch head still equals the PR's merged head.
  Squash/rebase merges may not preserve ancestry of the original branch: use
  PR metadata and the resulting changes, not only `git branch --merged`.
- Check that no other open PR depends on the branch as a head or base and that
  it has no post-merge commits or ongoing work. If uncertain, retain it and
  report the reason. A closed but unmerged PR is not enough to delete a branch.
- Delete only the verified task branch on GitHub, then refresh/prune remote
  tracking refs. For local cleanup, first move to `develop` or another retained
  branch without discarding work; keep any local branch with unpushed commits
  or changes in an attached worktree. Never use a destructive checkout/reset.
- Use normal GitHub merged-branch deletion or an authorized API operation.
  Never disable hooks/protection, force-push, or force-delete local branches to
  get around a failed safety check. Local deletion may be deferred after a
  squash merge; report retained branches and why.
- Report the deleted branches and any necessary branches retained.

# Forbidden shortcuts

- No `git push --force`, `--force-with-lease` on shared branches, `--no-verify`,
  `HUSKY=0`, or disabling/changing hooks to get around this workflow.
- No `netlify deploy --prod`, production API/MCP deploy, build-hook trigger,
  manual dashboard publish, or automatic deploy experiment without explicit
  authorization for that action. These are not substitutes for local testing.
- No changes to production branch, branch-deploy policy, Deploy Previews,
  auto-publishing, or build status unless requested.

# Hook setup and limits

After installing dependencies, run `npm run prepare` to activate the tracked
Husky hooks. They reject commits outside `develop`/`feature/*` and pushes to
disallowed remote branch names (including deletion of `main`). Hooks cannot
enforce PR merges through GitHub or prevent a user from disabling them. Require
GitHub branch protection/rulesets for `main`, required PRs and disabled bypasses.
Do not claim an instruction file can guarantee all agents or clients obey.

# Text style check

Use regular hyphens (-), never Unicode U+2014, in code, UI copy, documentation
and translations. Run `node scripts/check-text-style.mjs` before committing;
CI checks tracked UTF-8 text. Do not bulk-format inherited files to fix punctuation.
