# Contributing to Orvulix

Thank you for helping improve Orvulix, a free, open-source collection of browser-based utilities.

## Ways to contribute

- Report reproducible bugs or usability issues.
- Improve documentation, translations, and accessibility.
- Add or improve tests.
- Propose useful tools or improvements consistent with the project roadmap.

## Before you start

1. Review the [Code of Conduct](CODE_OF_CONDUCT.md) and [roadmap](docs/PRODUCT_ROADMAP.md).
2. Search existing issues and pull requests to avoid duplicate work.
3. For substantial changes, discuss the idea with the maintainers before investing significant effort.
4. Never commit API keys, secrets, credentials, or private user data.

## Local setup

```bash
git clone https://github.com/nguyenan97/orvulix-web.git
cd orvulix-web
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
npm run test -- --run
```

## Pull requests

Use the [engineering delivery guide](docs/ENGINEERING_DELIVERY.md) for task sizing,
behavioral specs, domain boundaries, BDD/TDD and review evidence. The
[security control matrix](docs/SECURE_DELIVERY.md) distinguishes active scans,
blocking checks and readiness gaps. Maintainers and AI assistants use the same
repository artifacts; a reader should not need the originating chat to review a PR.
Feature PRs target `develop`; production releases require separate authorization
under AGENTS.md and the [release checklist](docs/RELEASE_CHECKLIST.md).

- Keep changes focused and explain the problem and solution.
- Document user-visible behavior changes.
- Include relevant tests or explain why tests are not applicable.
- Respect existing licenses and retain required copyright notices.
- Do not imply that planned features, including the AI JSON Assistant, are already available.
- Do not change the manual production deployment policy without explicit maintainer agreement.

## Project origin and license

Orvulix is an independently maintained fork of [OmniTools](https://github.com/iib0011/omni-tools). The inherited source is MIT-licensed; see [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contact

For private security reports or Code of Conduct concerns, contact **founder@orvulix.io.vn**. For ordinary bugs and feature discussions, use GitHub pull requests or other enabled repository discussion channels.
