# GitHub Pages development environment

URL: https://nguyenan97.github.io/orvulix-web/

Netlify remains the production host. In GitHub Settings > Pages, Source must
be **GitHub Actions** and Custom domain must be empty. The `github-pages`
environment must permit deployments from `develop` (Settings > Environments

> github-pages > Deployment branches and tags); a main-only restriction
> will prevent this workflow from publishing.

## Workflow

Create `feature/*` from `develop` and open PRs only into `develop`. The Pages
workflow checks PRs without publishing. Merging into `develop` runs tests,
builds and deploys the dev site automatically. Pushes to `main` do not deploy
Pages. No Netlify token or production secret is required.

`workflow_dispatch` is also defined, but GitHub exposes manual dispatch only
when the workflow exists on the default branch. While this file exists only
on `develop`, use the automatic push trigger; do not move it to `main` merely
to enable the button.

## Local build

```sh
npm ci
node scripts/pages/build.mjs
```

The Pages build sets `VITE_PAGES_DEV=true`, passes the repository base to
Vite and converts the existing Netlify flat route HTML into directory indexes
in `pages-dist`. The router and translation backend use Vite's base URL.
Unknown routes use Pages' real 404, not a SPA fallback. Interactive routes
still use the existing React application.

All dev HTML and client navigation use `noindex`. Canonicals, production
JSON-LD and the production sitemap are excluded from the Pages artifact.
Robots does not block crawling, so crawlers can read noindex. This is public
hosting, not access control; never put secrets or private data in the build.

Regular `npm run build` retains the production pipeline and root base.
No tool source, translations or Netlify settings are changed. The only shared
integration points are App's router basename, i18n's loadPath and RouteSeo's
development metadata adapter. Keep these small changes when syncing upstream.

Pages does not execute Netlify Functions, redirects or response headers.
The dev site is for checking frontend behavior, not Netlify-specific backend
or caching behavior. External services used by tools keep their own limits.

After the first deployment, check the homepage, a direct tool URL, browser
refresh, navigation, translation requests, favicon and an unknown route.
