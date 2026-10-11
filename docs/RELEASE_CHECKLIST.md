# Release preparation: develop to main

Preparation does not authorize a production release. Merge feature PRs into
`develop`, review the resulting Pages environment, and ask for an explicit
release instruction before creating or merging a `develop` -> `main` PR.
Do not deploy just to validate code or enable Netlify branch deploys/previews.

## Before release

- Fetch origin and review the complete `origin/main...origin/develop` diff and
  commits, not only the latest feature. Confirm licensing, attribution, brand,
  contact, privacy and AI disclosures are accurate. Preserve unrelated user work.
- Prior changes in `develop` already edit two inherited tool files for branding:
  watermark default and EPUB creator text. This prototype adds no tool/locale
  edits; do not report the full release diff as touching no tool files. Review
  those two small branding integrations when syncing upstream.
- Run typecheck, all Vitest tests, Pages preparation tests, the production build
  (includes sitemap/HTML validation) and Pages build. CI now verifies both builds
  for feature PRs. Run focused SEO and demo browser checks locally.
- Inspect direct static HTML for title, description, canonical, OG, Twitter and
  parseable JSON-LD before JavaScript; verify sitemap and prerender URL parity.
  Unknown pages must be noindex and must not appear in the sitemap.
- Verify client navigation replaces head metadata even if unrelated or active
  translation downloads fail. Known initial prerendered metadata is preserved
  while the local English fallback loads. Old route identities are cleared.
- Review the dev site after merging into `develop`: repository-prefixed assets
  and links, direct tool/demo/info URLs, unknown route, mobile navigation,
  noindex, no production canonical and no live AI requests. Pages cannot prove
  Netlify HTTP routing or headers.
- Confirm Netlify settings remain `main` production-only, previews off. Inspect
  `netlify.toml` and `_redirects` for intended routing, headers and stale rules.
  Verify all valid flat route HTML files are present for Netlify Pretty URLs.
- Keep Claude mode unavailable. The JSON demo runs without funding, credentials
  or an SDK and clearly labels authored results. Do not claim startup approval.

## GitHub protections: dashboard action if API access is unavailable

Settings -> Rules -> Rulesets (or Branches -> protection). Protect `main` and
`develop`: require PRs, require relevant checks with up-to-date branches, block
force pushes/deletion, and disable routine direct-push bypass. For a solo founder
choose an approval policy that is usable (zero approvals if there is no other
reviewer) while retaining required PRs/checks. On `develop`, require the Pages
workflow's `build` job after it has run; use checks actually reported on `main`
for the release rule. Do not require a dev-only skipped job on `main`.

The integration used during preparation received HTTP 403 reading branch
protection; this document does not assert protections were installed. Confirm
them in GitHub. Keep the Pages environment limited to the intended dev branch;
do not change it to production `main` for ordinary development.

## Authorized release and post-deploy checks

1. After explicit authorization, create/review a `develop` -> `main` PR for the
   exact approved scope. Merge through GitHub checks; never push directly main.
2. Record the release commit and previous production commit. One production
   deploy consumes credits according to the actual Netlify plan; group changes.
3. Following that deployment, verify actual HTTP status on root, tool, category,
   info/demo URLs and a random missing URL (404, not an SPA 200). Verify headers,
   HTTPS/domain, canonical, sitemap, robots and OG image. Local Vite preview is
   not evidence of Netlify status codes or CDN behavior.
4. Submit/update the sitemap in Google Search Console and inspect representative
   URLs. Rendering correct metadata does not guarantee indexing or ranking.
5. If broken, prepare a reviewed fix or authorized rollback using the recorded
   release; do not change production outside the approved incident scope.
6. Apply the workflow skill's cleanup checks to merged task branches. Always
   retain `main`, `develop`, and any still-needed long-lived branches.
