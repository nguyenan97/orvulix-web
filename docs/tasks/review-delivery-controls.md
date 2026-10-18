# Task checkpoint: review-delivery-controls

- Updated: 2026-10-18, Asia/Bangkok
- Branch / base: feature/review-delivery-controls / develop at 163b54b0
- PR: pending
- Phase: reviewing
- Delivery mode: develop-merge
- Authorization: owner requested all review findings fixed, then explicitly chose
  required PR + green CI, zero required approvals and no bypass actors.
- Last verified tree: clean 163b54b0 before these uncommitted policy/docs files.

## Scope and acceptance

R01 only. Existing ruleset 24693146 prevents deletion/non-fast-forward updates of
main/develop but does not require PRs or checks. Preserve that ruleset; add separate
active review gates from security/repository-rules.json. No production release,
hosting change, direct branch push or destructive negative test.

- AC1: active rules for each target include pull_request with zero approvals,
  resolved conversations, no bypass actors and strict current-base checks.
- AC2: checks match actual GitHub Actions names/app 15368. Develop requires build,
  secret-scan, dependency-audit, codeql. Main requires test-and-build, Playwright
  Tests, secret-scan, dependency-audit, codeql. Never require post-merge deploy.
- AC3: record API readback; this PR is blocked while required checks are pending
  and can merge only after its matched-head checks pass. No direct-push probe.

Risk: repository delivery boundary. Zero approvals is the owner's explicit
single-maintainer choice, not independent approval or a security-scanner waiver.
CodeQL analysis success remains different from zero findings/severity enforcement.

## Progress and validation

Inspected current ruleset and PR43 check names; main CI job names confirmed from
the release PR17 head. Applied active rulesets main-review-gate 25337295 and
develop-review-gate 25337297 through GitHub API. Both return no bypass actors,
zero approvals, required conversations and strict check lists. Existing deletion
and non-fast-forward ruleset 24693146 is unchanged.
Docs/config only: JSON syntax, text style and full-diff self-review required;
normal exact-head CI remains required. No invented application runtime tests.

## Resume

Verify active branch rule readback, then commit/push/draft PR. Review full diff and latest
head CI before authorized develop merge and branch cleanup.
