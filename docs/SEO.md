# SEO architecture

Orvulix stays a client-rendered React SPA. SEO is handled by a small, React-free
model in `src/seo` that is used in two places:

- **At build time**, `scripts/seo/*` writes one static HTML file per indexable
  route (title, description, canonical, Open Graph, Twitter, JSON-LD,
  `<html lang>` and readable static content), `404.html` and `sitemap.xml`.
- **In the browser**, `RouteSeo` applies the same model to `<head>` on every
  client-side navigation, and `SeoContent` renders the same tool guidance that
  the static HTML contains.

There is no server-side rendering and no headless browser: the generator never
renders React.

## Build order

`npm run build` runs:

1. `tsc` — typecheck.
2. `vite build` — the SPA bundle and `dist/index.html` (used as the template).
3. `scripts/seo/prerender.mjs` — discovers routes, builds and validates the SEO
   model, writes `dist/<route>.html`, `dist/index.html` (home) and
   `dist/404.html`.
4. `scripts/generate-sitemap.mjs` — writes `dist/sitemap.xml` with Git-based
   `lastmod`.
5. `scripts/validate-sitemap.mjs` — the sitemap URL set must equal the
   indexable model routes **and** the set of generated route HTML files.
6. `scripts/seo/validate-dist.mjs` — validates every generated document
   (independently of the renderer), `404.html`, the social image, Netlify
   routing, cache headers and the font preload.

Any metadata problem fails the build with the file, key or route involved.

## Where metadata comes from

| Page                  | Source                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tools                 | `meta.ts`/`meta.tsx` under `src/pages/tools/**` (category, slug, i18n keys) and `public/locales/en/*.json`; optional hand-written override in `src/seo/tool-content/<route>.ts` |
| Categories            | `translation:categories.<category>.title/description` and the tools of the category                                                                                             |
| Home, info pages, 404 | `src/seo/pages.ts` (must match the routes in `src/config/routesConfig.tsx`; headings and intros are checked by tests against the page components)                               |
| Category overrides    | optional `CATEGORY_SEO_OVERRIDES` in `src/seo/pages.ts`                                                                                                                         |
| Site constants        | `src/seo/config.ts` (origin, brand, contact, social image)                                                                                                                      |

`scripts/seo/discover.mjs` reads tool metadata with regular expressions and
never executes tool source. Supported shapes are a literal
`defineTool('<category>', { path: '<slug>', i18n: { ... } })` and the
`number/generic-calc` generator (an array of data modules spread into
`defineTool`). Any other shape, a missing English string, an invalid slug or a
duplicate route fails the build.

Only tools the app actually registers are published: the build parses
`src/tools/index.ts` and the category `index.ts` files it spreads (comments
removed), so a tool that upstream comments out of a category array keeps its
`meta.ts` but gets no page and no sitemap entry; the build log lists such
tools. A registry shape the parser cannot resolve fails the build. A Vitest
test additionally checks that discovery equals the runtime registry.

The client builds the same model from the app's tool registry and i18next, and
a test asserts that build-time and client output are identical.

### Fallback metadata (tools without an override)

- Title: the first of `<Name> - Free Online <Subject> Tool | Orvulix`,
  `<Name> - Free <Subject> Tool | Orvulix`, `<Name> | Orvulix` that fits 60
  characters (`<Subject>` comes from the category title, e.g. "Text Tools").
- Description: whole sentences only, never cut mid-sentence. The English
  description (or its leading sentences) is used, falling back to the short
  description; when it is shorter than 120 characters one generic sentence
  about Orvulix is appended so the result is 120–155 characters.
- If no candidate fits, the build fails and asks for an override.
- When a category title does not end with "Tools", generic wording is used
  ("Free Online Tool"). Category pages that cannot meet the limits get a
  `CATEGORY_SEO_OVERRIDES` entry in `src/seo/pages.ts`.
- These limits only apply to the indexed English HTML. For other UI languages
  the client uses the localized name and whole leading sentences without the
  English suffixes; a translation that fails to load leaves the existing head
  untouched.

These limits are project conventions, not a promise of how Google displays
results. Titles and descriptions must be unique across all indexable pages.

## Adding or changing a tool override

1. Create `src/seo/tool-content/<category>/<slug>.ts` exporting a
   `ToolSeoOverride` (`src/seo/types.ts`): `title`, `description`, `howTo`,
   optional `examples`, `notes` and optional `faq`.
2. Register it in `src/seo/overrides.ts` under the route path without the
   leading slash (e.g. `'json/prettify'`).
3. Only state facts you verified in the tool's code and libraries. Do not claim
   local-only processing, "no upload" or privacy unless the code and every
   library involved were checked; mention CDN downloads (Monaco, Tesseract,
   background-removal models, FFmpeg) where they apply.
4. Run `npm run build` and `npx vitest --run src/seo`.

The content is shown under the tool (`SeoContent`, English UI only) and placed
in the tool's static HTML. FAQ entries are visible content only; no `FAQPage`
schema is emitted.

## New tools from upstream

New tools are picked up automatically: discovery scans every `meta.ts`/`meta.tsx`
that the app registers, so a merged upstream tool gets a static HTML file,
fallback metadata, JSON-LD and a sitemap entry without manual lists. The build
fails when:

- the metadata has a shape the scanner does not support (extend
  `scripts/seo/discover.mjs`, never skip the tool);
- an English string is missing or uses i18n interpolation;
- the fallback cannot produce a valid title/description (add an override);
- a new static route in `routesConfig.tsx` has no entry in `src/seo/pages.ts`;
- the tool registry uses a shape the parser cannot resolve.

## URLs, canonical, sitemap and lastmod

- Canonical URLs are absolute, on `https://orvulix.io.vn`, without a trailing
  slash (home is `https://orvulix.io.vn/`), without query strings.
- Route files are written as `dist/<route>.html`. With Netlify's default
  Pretty URLs, `/<route>` is served with 200 and `/<route>/` is redirected to
  it; a directory index (`<route>/index.html`) would instead redirect
  `/<route>` to `/<route>/` and change every existing URL.
- `dist/sitemap.xml` lists exactly the indexable routes; `404.html` is never
  included. `public/sitemap.xml` is no longer generated.
- HTML files copied unchanged from `public/` (e.g. a Search Console
  verification file) are served as-is and are not treated as routes.
- `lastmod` is the commit date, on the deployed branch's first-parent
  history (the date a change was merged, not when it was written on a side
  branch or upstream), of the most recent change to the page's content
  sources (`scripts/seo/sitemap.mjs`):
  - tool: its directory (or the generator files and its data module), its
    English locale subtree and its override file;
  - category: its locale strings and the names/short descriptions of its tools;
  - home: `src/pages/home`, `src/components/Hero.tsx`, `hero` and `categories`
    strings;
  - info pages: not tracked, because all of them live in
    `src/pages/information/index.tsx` and a change to one page cannot be told
    apart from a change to another; their `<url>` entries have no `lastmod`.
- Locale files are compared value by value, so editing one tool's strings
  does not change other tools' dates. `lastmod` is omitted (with a warning)
  when Git is unavailable, a source has uncommitted changes, or history before
  a shallow clone boundary would be needed. The build time is never used.
  Netlify builds use full (blobless) clones; GitHub Actions needs
  `fetch-depth: 0`.

## Routing and 404

- There is no SPA fallback rewrite. Every valid route has its own HTML file,
  so unknown paths are served `dist/404.html` with HTTP 404 and
  `noindex`. `validate-dist.mjs` fails if a catch-all rewrite to
  `index.html` is reintroduced in `netlify.toml` or `public/_redirects`.
- Adding a client-side route therefore requires a static HTML file: add it to
  `routesConfig.tsx` and `src/seo/pages.ts` (or it is a tool, discovered
  automatically). Dynamic routes other than `/categories/:categoryName` and
  tools are not supported without extending the generator.
- `/404.html` requested directly returns 200 on Netlify (it is a real file);
  it is `noindex`.

## Client metadata and static HTML

- `RouteSeo` (mounted once in `App.tsx`) is the only writer of title,
  description, robots, canonical, Open Graph, Twitter and JSON-LD tags. It
  removes any such tag (template, previous route) before inserting the current
  ones and does nothing when the head already matches the prerendered HTML.
- Pages still contain `<Helmet>` blocks from upstream; `RouteSeo` sets
  `Helmet.canUseDOM = false` so they cannot write to the document. Their
  values are ignored — change metadata in `src/seo`, not in page components.
- Only the `lang` attribute of `<html>` is set by the generator; other
  attributes in `index.html` are kept.
- Static body content (breadcrumbs, tool guidance, related links) is placed
  inside `#root` and replaced by React on its first render; the `<noscript>`
  block carries the H1 and description. Both only contain text that the React
  page also shows.

## Integration points and upstream sync hotspots

Files outside `src/seo` and `scripts/seo` that carry SEO integration
(search for `ORVULIX-SEO`):

| File                                | Change                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| `src/components/App.tsx`            | mounts `<RouteSeo />`                                      |
| `src/tools/defineTool.tsx`          | renders `<SeoContent />` under each tool                   |
| `index.html`                        | no hardcoded canonical/og:url; preloads the Quicksand font |
| `public/_redirects`, `netlify.toml` | no SPA fallback; cache headers                             |
| `package.json`                      | build script, `esbuild` devDependency                      |
| `.github/workflows/ci.yml`          | full Git history for the build job                         |

Upstream changes most likely to need attention:

- New `<Helmet>` usage in pages (ignored by design; port its metadata to
  `src/seo` if it matters).
- New routes in `routesConfig.tsx` (build fails until `src/seo/pages.ts` has
  them).
- New tool metadata shapes or renamed i18n keys (build fails with details).
- Changes to `index.html` structure (`<div id="root"></div>` must stay empty
  and unique).
- Re-added SPA fallback in `public/_redirects` (validation fails).
- Tools commented out of a category array (skipped and listed in the build
  log) and new Vite output types that should be cached long-term (only
  `/assets/*.js`, `*.mjs` and `*.wasm` are immutable today).

## Checks after syncing upstream

```bash
npm ci
npm run typecheck
npx vitest --run
npm run build          # prerender + sitemap + validation
npx playwright test src/seo   # optional, needs browsers
```

Also confirm the reported counts of home/info/category/tool routes changed as
expected, and review new tools that only have fallback metadata.

## Remaining limitations

- Tools without an override keep upstream wording in their fallback titles
  and descriptions (e.g. one-word names like "Generate"); add overrides for
  the tools that matter most.
- Content is still rendered by React; static HTML carries metadata, headings,
  descriptions, tool guidance and links, not the interactive tool UI.
- Only English is indexable. The UI language is stored in `localStorage`, so
  other languages have no URLs and no `hreflang`.
- Netlify's Pretty URL and trailing-slash behaviour can only be confirmed on a
  real deploy; the local CLI does not emulate it.
- `Cache-Control` headers are not emulated by the Netlify CLI and must be
  checked on the deployed site. Hashed CSS and images keep Netlify's default
  revalidation because `public/assets` mixes unhashed files into `/assets`.

## Known issues outside this change

Found while implementing this and left unchanged (upstream-owned files):

- `/categories/<unknown>` crashes `src/pages/tools-by-category` (React error,
  blank page); it is now served with HTTP 404, but the page itself still
  crashes.
- Category pages render two `<h1>` elements (Hero and the category title).
- `favicon.ico`, `favicon.png`, `favicon-96x96.png`, `apple-touch-icon.png`
  and the manifest PNG icons still show the previous OmniTools mark; only
  `favicon.svg` is Orvulix-branded.
- `README.md` still says the build writes `public/sitemap.xml`; it is now
  `dist/sitemap.xml`.

## After an authorized production release

1. Spot-check with `curl -I`: `/string/uppercase` → 200, `/string/uppercase/`
   → 301 to the slash-less URL, `/no-such-page` → 404, `/assets/<file>.js`
   → `Cache-Control: public, max-age=31536000, immutable`.
2. Search Console → Sitemaps: resubmit `https://orvulix.io.vn/sitemap.xml`.
3. URL Inspection on the home page, one category and two tools: check
   "User-declared canonical" equals the URL and the rendered HTML has one
   canonical.
4. Pages report: watch "Duplicate, Google chose different canonical",
   "Soft 404" and "Not found (404)"; the old `/number/generic-calc/` URL
   should move to 404.
5. Rich Results Test on a tool and the home page to confirm JSON-LD parses.
   Tool pages use `WebApplication` without price or rating data (none is
   published), so the Rich Results Test and the Search Console "Software
   apps" report will list them as invalid items for the Software App rich
   result ("offers" and "aggregateRating or review" missing). This is
   expected, does not affect indexing or ranking, and must not be "fixed" by
   adding invented prices or ratings. Breadcrumbs should validate.
6. Validate social previews (e.g. LinkedIn Post Inspector, Facebook Sharing
   Debugger) for a tool URL.
