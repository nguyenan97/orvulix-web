# Security controls and delivery evidence

This is a project-specific baseline, not certification. It applies to every task
through risk selection and existing CI, including AI-authored code. Actual source
of truth: .github/workflows/security.yml, pages-dev.yml, package.json and
[SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md). No global machine policy is
installed. Reusing this baseline elsewhere requires inspecting that project's
stack, trust boundaries, scanner support, licenses and hosting first.

## Controls and current enforcement

| Control | Current mechanism | What blocks / limitation |
| --- | --- | --- |
| Dependency SCA | npm run security:check, lockfile audit on PR/push/schedule | Gate rejects unaccepted high/critical and invalid/outage results; exact owned expiring exceptions remain visible |
| SAST | CodeQL JavaScript/TypeScript analysis and metadata summary | Analysis/schema failures fail; severity alone does not fail this job. Review results/dispositions. Existing five high-scored results are documented, not declared fixed |
| Secrets | Gitleaks CLI v8.30.1, checksum-pinned download, full fetched Git history and current checkout, redacted output | Nonzero exit blocks job; no baseline/blanket exclusions. Known synthetic fixture matches require narrow reviewed rule/path disposition, never automatic suppression |
| Runtime boundary regressions | src/security/security.e2e.spec.ts in develop PR Pages build plus affected feature tests | Failed assertions fail CI; coverage only proves tested paths, not every tool/input |
| Build/deployment separation | Production and Pages builds on develop PR; dev publish after merge | Pages validates prefix/noindex; cannot execute Netlify response headers or Functions |
| Dependency maintenance | Weekly Dependabot and scheduled security workflow | Updates create PRs for review; do not auto-merge or resolve findings by disabling the gate |
| Server enforcement | GitHub rulesets/required checks | Dashboard state must be verified; workflow files do not install required checks or prohibit admin bypass |

Security workflow covers PRs into develop/main, pushes to those branches, weekly
schedule and manual execution. A failed scan requires triage; absence of a report,
unavailable scanner or permission failure is not a zero-finding result. Required
status configuration is external; this task does not change protections.

## Threat selection for a changed feature

Record input -> transformation -> output, sensitive data, attacker control,
execution context, network destinations and trusted dependencies. Include CI
execution when repository files or dependencies are untrusted.

| Changed surface | Required review/evidence |
| --- | --- |
| HTML/Markdown/SVG/URL/message | Context-safe output, proven sanitization at active sinks, allowed protocols/origins, iframe isolation; browser malicious-input regression |
| PDF/image/XML/archive/regex | Byte/page/pixel/expansion/deadline budgets, parsing errors, worker containment, cancellation and cleanup; boundary and recovery tests |
| Network/model/remote assets | Distinguish downloads from user input uploads; inspect payloads/destinations, privacy/consent, cancellation and offline failure; never bundle provider credentials |
| Dependencies/build/CI | Lockfile and license impact, actual package consumers, action SHA/checksum provenance, minimal permissions, untrusted PR isolation; no privileged pull_request_target execution of PR code |
| Auth/backend/persistence | Currently N/A to this static SPA. A future scoped design must add authorization, session/CSRF/input/data controls and server-specific scans before claiming readiness |
| Docker/IaC | Inspect only if the task introduces/deploys these artifacts; select container/IaC scan then. Do not add unrelated scanners solely for a longer tool list |

Use OWASP ASVS 5.0.0 as an applicability reference, with versioned requirement IDs
only after reading the actual requirement. Do not claim ASVS compliance from
this matrix or from SAST/SCA. This guide links the standard; it does not reproduce
the standard's requirements. See the [research/license record](AI_WORKFLOW_RESEARCH.md).

## Findings and exceptions

For each finding record scanner/rule/advisory, affected version/path, reachable
source and sink, impact, evidence, fix or constrained disposition, owner, expiry
and retest criteria. Do not paste sensitive matches or exploit documents into PRs.
Unreviewed new findings and task-introduced exploitable defects block acceptance.
Existing CodeQL dispositions need reassessment when input provenance or sinks
change. An npm exception is not a CodeQL exception or a secret-scanner baseline.

No broad ignore paths, unlimited exceptions, severity downgrades, continue-on-error
or fabricated approvals to get green checks. Exposed credentials require owner
rotation/revocation; removing a committed secret alone does not resolve exposure.
Use [SECURITY.md](../SECURITY.md) for private reporting. Do not rewrite shared Git
history, run active production scans or change hosting/protections implicitly.

## Explicit readiness gaps and follow-up ownership

- Owner nguyenan97: review CodeQL dispositions in GitHub and choose a separate
  severity enforcement design if needed. Acceptance: exact result identities,
  reviewed narrow exceptions with expiry, fail-closed tests and demonstrated new
  finding rejection. Current metadata summary is intentionally not called a gate.
- Owner nguyenan97: verify required checks/rulesets and private reporting in the
  dashboard. Acceptance: recorded actual policy and check names for each target.
  This is an external action, not assumed completed by documentation.
- Existing dependency exceptions/remediations retain their owners and deadlines
  in SECURITY_REMEDIATION.md. Do not reset their age by copying them here.
- For an explicitly authorized release, verify actual Netlify HTTP behavior and
  evaluate compatible browser policy/header controls against workers/WASM/iframes.
  DAST and CSP rollout require a separate local/authorized target and threat scope;
  this task does not run ZAP against production or assert headers are configured.

## Scanner maintenance

Gitleaks uses the upstream CLI directly, avoiding the separate commercial GitHub
Action's organization license requirement. The archive version and SHA-256 are
reviewed together; an unverified download never executes. The Windows local
verification uses the matching official Windows archive/digest. CI fetches full
history and also scans the checkout so merge/worktree-only content is covered.
Do not print raw findings or upload unredacted reports. Audit scanner updates in
a normal PR and rerun a synthetic leak/clean control before accepting a new pin.
