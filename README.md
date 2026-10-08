# Orvulix

**Orvulix** is a free, community-oriented, open-source collection of browser-based utilities for developers and everyday tasks, including JSON, PDF, image, and text tools.

- **Website:** https://orvulix.io.vn/
- **Source code:** https://github.com/nguyenan97/orvulix-web
- **License:** [MIT](LICENSE)
- **Roadmap:** [Product roadmap](docs/PRODUCT_ROADMAP.md)
- **Community guidelines:** [Code of Conduct](CODE_OF_CONDUCT.md)
- **Contributing:** [Contribution guide](CONTRIBUTING.md)

## Open source and project background

Orvulix is an independently maintained fork of [OmniTools](https://github.com/iib0011/omni-tools), originally created by Ibrahima Gaye Coulibaly. We are grateful to the original author and contributors. The original MIT copyright notice is retained in [LICENSE](LICENSE).

Orvulix is currently offered as a free, non-commercial public utility project. The repository is public, licensed under MIT, and welcomes community contributions. Orvulix is not affiliated with or endorsed by the original OmniTools maintainers.

## Features

The website provides web-based tools for working with JSON and other data formats, documents, images, text, and common developer workflows. See the live website for the currently available tools.

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

The production build generates `public/sitemap.xml` from tool metadata, then builds into `dist/`. Verify generated URLs match actual application routes before publishing.

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

Production deployments are manually controlled. Confirm Netlify Git Integration automatic builds are disabled before merging; merge and verify CI before running a controlled Netlify deploy. Do not enable automatic deployment unless intentionally changing this release policy.

## Roadmap

See [Product roadmap](docs/PRODUCT_ROADMAP.md) and the website's `/roadmap` page. The Claude-powered AI JSON Assistant is a **planned feature only**; there is no live Claude API integration.

## License and attribution

Licensed under the [MIT License](LICENSE). The original copyright holder is Ibrahima Gaye Coulibaly. Preserve the original license notice in redistributed copies or substantial portions of the inherited software. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for project-origin attribution and licensing guidance.

The website is hosted on [Netlify](https://www.netlify.com/).
