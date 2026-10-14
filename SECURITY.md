# Security policy

Orvulix accepts reports about its published application and current development
branch. A dependency audit result alone does not establish exploitability; include
the affected version, reachable input and reproducible impact when possible.

Do not post secrets, private files or working exploit payloads in public issues.
Use GitHub's **Report a vulnerability** entry on this repository's Security page
if private vulnerability reporting is enabled. It was disabled when checked on
2026-10-14. If that entry is unavailable, use the project's published
[Contact page](https://orvulix.io.vn/contact) to request a private reporting channel
before sending sensitive details. No response-time SLA is promised.

Supported scope includes browser tools, their parsers/renderers/workers, published
assets and the repository's build/test pipeline. Do not test against production
in a way that disrupts other users. Reports about third-party hosting or packages
should also follow the provider's reporting policy.

See [security remediation and remaining risks](docs/SECURITY_REMEDIATION.md) for
the current dependency disposition, audit gate, temporary exceptions and CI
activation limits. A passing CI check is not a claim that all vulnerabilities or
application security issues are resolved.
