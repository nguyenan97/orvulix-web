# Task checkpoint: ai-engineering-workflow

- Updated: 2026-10-18 Asia/Bangkok
- Branch / base: feature/ai-engineering-workflow / develop
- PR: https://github.com/nguyenan97/orvulix-web/pull/42
- Phase: CI
- Delivery mode: develop-merge
- Authorization: research and improve project agent skills and software delivery;
  standing develop merge authorization applies. No production release.
- Last verified tree: d5c6f6c249b0004157b272fd5b9460d88e3634a9; initially clean.

## Scope and acceptance

- Research primary GitHub sources with dated stars, pinned commits, licenses and
  adopt/defer/reject decisions, fitted to the actual React/TypeScript SPA.
- Human-readable delivery guide and discoverable skills connect specification,
  pragmatic DDD, BDD/TDD, security, review, operations and existing merge gates.
- Preserve existing workflow authority, app stack, upstream locality and hosting.
- Add a pinned, redacted secret scan; prove clean and intentional-leak outcomes.
- Distinguish scan completion from enforcement and production readiness.
- No runtime migration, global skill installation, production scan/deploy, paid
  platform, protection change or unrelated vulnerability remediation.

## Completed and pending

Discovery: dependency audit and CodeQL already exist. CodeQL summary is not a
severity gate; five reviewed high-scored results have existing dispositions in
SECURITY_REMEDIATION.md. Do not suppress or relabel them for this task.
Research metadata fetched directly with GitHub API. Nine selected repositories
have dated stars, pinned commits and license/disposition records. Added two focused
skills, human delivery/security guides, contributor/release pointers and PR/task
templates. Added checksum-pinned Gitleaks history/checkout scan and CI clean/leak
controls without changing audit/CodeQL thresholds or hosting.

## Validation and review

Local evidence on the uncommitted task tree above the initial base:

- quick_validate.py: architecture-design, secure-delivery, sdlc-task-loop and
  project-communication all valid.
- 27 relative Markdown file links resolve; new Markdown has no forbidden em dash;
  security YAML parses and every added bash run block passes bash -n.
- Gitleaks 8.30.1 Windows archive SHA-256 verified before execution. Clean fixture
  exits 0; synthetic PAT fixture exits 1. Full fetched Git history and a copied
  current checkout (tracked plus nonignored new files) both pass. No raw matches
  printed. Linux archive/execution and controls remain CI evidence pending.
- npm run security:test: 26/26 pass. npm run security:check: 0 unaccepted
  high/critical, one existing temporary exception; no policy/expiry change.
- node scripts/check-text-style.mjs and git diff --check pass for tracked changes;
  rerun style after staging new files.
- Requirements/standards self-review: no task blocker identified. Routing walkthroughs:
  docs/copy selects focused checks without TDD/ADR; converter lifecycle change maps
  cancellation/output fidelity to tests; new remote AI integration requires data
  flow/credentials/privacy design; release request still requires separate explicit
  authority and actual hosting evidence. This is manual self-review, not independent
  approval or an empirical guarantee of future agent behavior.

No application runtime changes. CI retains existing full build/tests/browser gates.
Initial implementation committed as 7526bfb; draft PR42 opened. Architecture
research was extended with Bulletproof React and Domain-Driven Hexagon to ground
the design guidance in application engineering as well as agent workflows.
Current follow-up changes are documentation/checkpoint only; prior scanner and
security test evidence remains applicable, latest-head CI still required.
Pending: final review/commit, latest-head CI and matched-head merge.

## Resume point

Validate final documentation additions, commit/push to PR42, mark ready and inspect
latest-head CI. Merge only when existing acceptance/review/CI gates pass.
No owned server/process/worktree. Reconcile Git/PR/CI before continuing.
