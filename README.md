# Orvulix

Free online tools for JSON, PDF, images, text, and everyday tasks.

**Website:** https://orvulix.io.vn/

## Stack

- React, TypeScript, Vite
- Netlify hosting, manually controlled production releases
- npm for package management

## Development

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

The production build generates `public/sitemap.xml` from tool metadata, then builds into `dist/`. Verify that the generated URLs match actual application routes before publishing.

## Search engine setup

- Production origin: https://orvulix.io.vn/
- Robots: https://orvulix.io.vn/robots.txt
- Sitemap: https://orvulix.io.vn/sitemap.xml (available after deployment)
- Verify the `orvulix.io.vn` Domain property in Google Search Console using the DNS TXT record provided by Google. Keep the TXT record in DNS to maintain verification.
- Submit the sitemap in Search Console only after a verified production deployment. The sitemap URL must serve valid XML.

## Deployment

Production deployments are manual. Confirm Netlify Git Integration automatic builds are disabled before merging; merge and verify CI before running a controlled Netlify deploy. Do not enable automatic deployment unless intentionally changing this release policy.

## Product roadmap

See [Product roadmap](docs/PRODUCT_ROADMAP.md) and the website's `/roadmap` page. The Claude-powered AI JSON Assistant is a **planned feature only**; there is no live Claude API integration.

## Attribution and license

This project is based on an open-source MIT-licensed project. The original copyright holder is Ibrahima Gaye Coulibaly. Preserve the original MIT license notice in [LICENSE](LICENSE).
