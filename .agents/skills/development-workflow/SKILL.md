---
name: development-workflow
description: Mandatory Git and Netlify workflow for every development, commit, push, PR, and release task in this repository.
---

# Required workflow

1. Read root `AGENTS.md`. Run `git status --short --branch`, inspect the current
   branch and upstream, and preserve existing changes.
2. Work on `develop` or `feature/*` based on `develop`. If on another branch,
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
7. Only when the user explicitly asks to release: review the full `develop` vs
   `main` diff, run appropriate checks and local build, and use a PR from
   `develop` to `main`. Merge only within the user's authorized release scope.
   This can trigger a production deploy costing 15 credits under the current plan.
   Never push directly to `main`, including during a release.

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
