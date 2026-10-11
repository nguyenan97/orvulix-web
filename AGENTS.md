# Mandatory development and release workflow

These rules apply to every agent working anywhere in this repository.
Before editing, committing, pushing, opening a PR, or deploying, read and follow
`.agents/skills/development-workflow/SKILL.md`.

- Create `feature/*` from `develop` for new tasks and open PRs only into `develop`; do not push task changes directly to `develop`. Never develop or commit on `main`, a detached HEAD, or an unrelated branch.
- Feature PRs target `develop`. Only an explicit user request to release authorizes a `develop` -> `main` release PR and merge.
- After an authorized PR merge, verify the merged head and delete its completed task branch from GitHub and, when safe, locally. Follow the skill's cleanup checks; always retain `main`, `develop`, and necessary long-lived branches. Cleanup never authorizes a merge.
- A request to fix, implement, commit, or push is NOT permission to release.
- Never push directly to `main`, force-push shared branches, or bypass Git hooks or branch protections.
- Never run production deploys, trigger Netlify build hooks, or enable branch deploys/Deploy Previews without an explicit user request for that action.
- Validate locally; never deploy just to test a change.
- Preserve user changes. Stage only files belonging to the current task.
- Do not weaken these rules or their hooks unless the user explicitly requests a workflow change.

Netlify configuration: production branch `main`; branch deploys production-only;
Deploy Previews disabled; builds Active. Dashboard settings are external and must
not be assumed to be enforced by this file.

Development environment: https://nguyenan97.github.io/orvulix-web/ on GitHub
Pages, built from `develop` by `.github/workflows/pages-dev.yml`. Feature PRs
into `develop` run checks without publishing; pushes after merging into
`develop` publish the dev site once the Pages environment allows this branch.
Keep the dev site's `noindex` and repository base path. Never use the production
domain as a Pages custom domain or change production settings to test dev work.
GitHub Pages does not execute Netlify Functions, redirects, or response headers.

Git hooks are local safeguards, not a security boundary. GitHub must protect `main`
with required PRs and no direct-push bypass for server-side enforcement.

## Text style

Never use em dashes (Unicode U+2014). Use regular hyphens (-) instead in code,
UI copy, documentation and translations. Run `node scripts/check-text-style.mjs`
before committing. Preserve upstream file formatting when replacing punctuation.
