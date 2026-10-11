# Orvulix

**Orvulix** is a free, community-oriented, open-source collection of browser-based utilities for developers and everyday tasks, including JSON, PDF, image, and text tools.

- **Website:** https://orvulix.io.vn/
- **Website dev:** https://nguyenan97.github.io/orvulix-web/ - GitHub Pages, built from `develop`.
- **Source code:** https://github.com/nguyenan97/orvulix-web
- **License:** [MIT](LICENSE)
- **Roadmap:** [Product roadmap](docs/PRODUCT_ROADMAP.md)
- **Planned features:** [Issue-backed backlog](docs/FEATURE_BACKLOG.md)
- **Community guidelines:** [Code of Conduct](CODE_OF_CONDUCT.md)
- **Contributing:** [Contribution guide](CONTRIBUTING.md)

## Open source and project background

Orvulix is an independently maintained fork of [OmniTools](https://github.com/iib0011/omni-tools), originally created by Ibrahima Gaye Coulibaly. We are grateful to the original author and contributors. The original MIT copyright notice is retained in [LICENSE](LICENSE).

Orvulix is currently an early-stage, independently developed project maintained by a solo founder. It is not incorporated and has not received external investment. The public utilities are currently offered free of charge and the project is non-commercial at this stage. The repository is public, licensed under MIT, and welcomes community contributions. Orvulix is not affiliated with or endorsed by the original OmniTools maintainers.

## Features

The website provides web-based tools for working with JSON and other data formats, documents, images, text, and common developer workflows. See the live website for the currently available tools.

### Inherited functionality and Orvulix additions

The utility implementations originate from OmniTools; Orvulix does not claim to have built them from scratch. Orvulix additions include its branding and domain, product information pages, shared route SEO and static HTML generation, verified guides for selected tools, and separate GitHub Pages development and Netlify production workflows. These are project adaptations, not evidence of customers, revenue or startup-program approval. Original licensing and attribution remain in place.

Tools differ in how they handle data. Some run locally while downloading libraries, models or workers from third-party CDNs; downloading those resources does not itself mean an input file is uploaded. Check the individual tool's guidance and [privacy policy](https://orvulix.io.vn/privacy) before using sensitive data. A planned Claude integration must not be confused with existing browser-based machine-learning tools such as background removal.

## Development

Prerequisites: Node.js and npm.

```bash
git clone https://github.com/nguyenan97/orvulix-web.git
cd orvulix-web
npm ci
npm run dev
```

## Build and test

```bash
npm run typecheck
npm run build
npm run test -- --run
```

The production build generates route HTML and `dist/sitemap.xml` from tool metadata. Verify generated URLs match actual application routes before publishing.

## Contributing and community

We welcome bug reports, documentation improvements, translations, accessibility improvements, tests, and code contributions. Read [CONTRIBUTING.md](CONTRIBUTING.md) and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

For public contributions, open a pull request on GitHub. Security-sensitive reports should not be posted publicly; use the contact address below.

**Contact:** founder@orvulix.io.vn

## Search engine setup

- Production origin: https://orvulix.io.vn/
- Robots: https://orvulix.io.vn/robots.txt
- Sitemap: https://orvulix.io.vn/sitemap.xml
- Verify the `orvulix.io.vn` domain property in Google Search Console using the DNS TXT record provided by Google. Keep that record in DNS.
- Submit the sitemap after a verified production deployment.

## Deployment

The development website runs on GitHub Pages from `develop`; production runs on Netlify from `main`. Create `feature/*` branches from `develop` and target development PRs only at `develop`. After the Pages workflow is merged and its environment permits `develop`, pushes to `develop` deploy the dev website. See [GitHub Pages dev setup](docs/GITHUB_PAGES_DEV.md).

Only an explicit release request authorizes a `develop` → `main` PR and merge. Merging into `main` triggers the configured Netlify production build and can consume production deployment credits. Do not create release PRs, merge into `main`, or deploy production as part of routine development.

## Product direction and Claude for Startups

Orvulix is exploring an optional Claude-powered developer workflow. This branch includes a [local JSON Assistant demo](docs/JSON_ASSISTANT.md) at `/json-assistant`: three authored sample explanations, candidate schema inference, and deterministic structural validation. It uses no Claude API, API key, paid inference or AI SDK. A live Claude integration is **not yet available**; the demo is not evidence of model accuracy or startup-program eligibility.

The founder has created a Claude Console account using the project-domain email. This does not mean Orvulix has been approved for any Anthropic startup program or awarded credits. As an unincorporated solo-founder project, eligibility is subject to Anthropic's current terms and review; the project does not claim to be a registered company.

The [Regex Assistant demo](docs/REGEX_ASSISTANT.md) at `/regex-assistant` adds authored hashtag, date-shape and log-level examples, plus real local regex testing with match ranges, captures and a disposable worker timeout. It uses no Claude API, API key or paid inference. Custom expressions get local test results, not fabricated explanations.

## Roadmap

See [Product roadmap](docs/PRODUCT_ROADMAP.md) and the website's `/roadmap` page. The Claude-powered AI JSON Assistant is a **planned feature only**; there is no live Claude API integration.

## License and attribution

Licensed under the [MIT License](LICENSE). The original copyright holder is Ibrahima Gaye Coulibaly. Preserve the original license notice in redistributed copies or substantial portions of the inherited software. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for project-origin attribution and licensing guidance.

Production is hosted on [Netlify](https://www.netlify.com/); the development environment is hosted on GitHub Pages.
