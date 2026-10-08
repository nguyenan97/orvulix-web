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
