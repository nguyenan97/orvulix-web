# Mandatory development and release workflow

These rules apply to every agent working anywhere in this repository.
Before editing, committing, pushing, opening a PR, or deploying, read and follow
`.agents/skills/development-workflow/SKILL.md`.

- Develop on `develop` or `feature/*` created from `develop`. Never develop or commit on `main`, a detached HEAD, or an unrelated branch.
- Feature PRs target `develop`. Only an explicit user request to release authorizes a `develop` -> `main` release PR and merge.
- A request to fix, implement, commit, or push is NOT permission to release.
- Never push directly to `main`, force-push shared branches, or bypass Git hooks or branch protections.
- Never run production deploys, trigger Netlify build hooks, or enable branch deploys/Deploy Previews without an explicit user request for that action.
- Validate locally; never deploy just to test a change.
- Preserve user changes. Stage only files belonging to the current task.
- Do not weaken these rules or their hooks unless the user explicitly requests a workflow change.

Netlify configuration: production branch `main`; branch deploys production-only;
Deploy Previews disabled; builds Active. Dashboard settings are external and must
not be assumed to be enforced by this file.

Git hooks are local safeguards, not a security boundary. GitHub must protect `main`
with required PRs and no direct-push bypass for server-side enforcement.
