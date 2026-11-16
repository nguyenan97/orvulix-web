# Task checkpoint: PR66 audit and CI

- Updated: 2026-11-16 UTC+7
- Branch / base: feature/pr66-audit-ci / develop a5c78e73
- PR: pending
- Phase: developing
- Delivery mode: develop-merge
- Authorization: fix the reviewed PR66 blockers; production merge/release excluded.

## Scope and acceptance

AC1: npm dependency cycles with reachable concrete advisories normalize without
losing high/critical findings, independent of entry order. Missing references and
ungrounded cycles still fail. Evidence: Node audit regression tests.
AC2: remove the expired/stale braces exception, refresh affected dependencies and
pass the unchanged high/critical gate. No blanket exceptions or forced major overrides.
AC3: Playwright workflows use Ubuntu 24.04 supported by the locked Playwright.
Validate lint/typecheck/unit/build/security and browser regressions for dependencies.

Trust boundary: registry JSON -> validated advisory graph -> policy/CI status.
Application user inputs/sinks are unchanged. Dependency updates require sanitizer
and DOM emulator regressions. Gitleaks/CodeQL remain CI controls; no production scan.
No framework, hosting/protection or paid service changes. Existing dependency
licenses remain subject to review. Self-review is not independent approval.

## Completed and pending

Regression tests reproduced cycle rejection. Traversal now tolerates back edges
and checks each package reaches a concrete advisory. Removed expired exception.
Pinned both workflows to Ubuntu 24.04. Dependency refresh/validation in progress.

## Resume point

Inspect actual branch/head/status and dependency install result; run security gate,
complete checks and review, then open/update one PR into develop. Uncommitted task
files currently present. No production release authorized.

## Implementation checkpoint

DOMPurify 3.4.18, happy-dom 21.0.4, joi 18.3.2 and follow-redirects 1.16.3
installed. Zod 3 has no compatible patch; reviewed call sites and recorded exact
30-day exception with owner/retest criteria in SECURITY_REMEDIATION.md. Security
gate passes (26 package findings / 18 advisories; 0 unaccepted high/critical,
1 temporary exception). All 29 security tests, lint, typecheck and style pass.
Full units/build/browser checks pending. Local browser dependency installer lacked
root access; browser-only downloads attempted next. No test outcome assumed.

## Validation checkpoint (implementation 04b6a327)

- Full units: 195 files / 2022 tests passed, including happy-dom 21 migration.
- Security scripts: 29 tests passed; unchanged audit gate passed with one Zod exception.
- Lint/typecheck/production build/style/diff checks passed.
- Pages build: 166 HTML files validated at /orvulix-web/; prepare tests and emitted
  list worker audit passed. First overlapping Pages attempt was stopped, then
  rerun sequentially after production browser checks and passed.
- Native sanitizer/security/HTML image/PDF: 46 Chromium/Firefox tests passed.
  WebKit default launch blocked by host libraries. Downloaded Debian libraries
  into /workspace/work/browser-libs without system installation; direct bundled
  WebKit launch and text rendering passed. Local-only config points to that same
  executable with LD_LIBRARY_PATH. Initial rerun used Pages output against tests
  with root-only routes, so it was stopped; restore production output before retry.
- CI at 04b6a327: audit, secret scan, CodeQL passed; Pages build/E2E pending.
- CodeQL metadata: five rule/location pairs match existing dispositions in
  SECURITY_REMEDIATION.md (table-text converter, SEO validator, Pages prepare,
  test entity decoding). No new rule/location in summary. Alert API/protection
  API returned 403; no claim of complete alert state or changed protections.

Self-review: grounded traversal validates all entries before reachability, retaining
concrete severities, deduplication and exact exceptions. No assertions, deadlines,
retries or severity policy weakened. Dependency license changes: none; existing
licenses documented in remediation. No app sink or networking behavior changed.

PR: https://github.com/nguyenan97/orvulix-web/pull/67 (draft)
Phase: CI. Remaining: WebKit regressions on restored production output, latest-head
CI, mark ready and normal matched-head develop merge only if gates allow. Do not
merge release PR66 or deploy production. Later documentation-only commit reuses
04b6a327 implementation evidence; resolve actual head from GitHub.
