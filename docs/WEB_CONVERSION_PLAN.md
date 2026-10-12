# Web and HTML conversion plan

Research snapshot: October 12, 2026. Base inspected: develop at 31fb8ac.
This document plans delivery, not proof of completed capabilities. See
[implementation prompt](WEB_CONVERSION_PROMPT.md) for agent execution rules.

## Research and decisions

[Web2PDFConvert](https://www.web2pdfconvert.com/) offers URL/HTML to PDF/image.
[HTML input](https://www.web2pdfconvert.com/html/to/pdf/) supports paste/upload;
[image output](https://www.web2pdfconvert.com/html/to/img/) supports PNG/JPG.
PDF controls include viewport, paper/orientation/margins, ranges, scale, delay,
background, lazy content and fixed positions. Image controls include dimensions,
zoom, format, delay and JavaScript/cookie overlays. The site credits ConvertAPI.
Screenshots and public controls were inspected, not real conversions or quotas.
No verified pricing/cost estimate is assumed.

Use HTML to Image as the first local feature. Keep URL conversion separate:
[same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)
prevents a SPA from capturing arbitrary remote DOM. CORS fetch is not a rendered
page. Do not use public proxies, no-cors or the reference site's service API.

Remote rendering is a conversion backend, not SSR for the existing React SPA.
Keep current production SEO/static routes and Pages dev isolation unchanged.

| Repository | Stars on research date | License/fit |
| --- | ---: | --- |
| [Playwright](https://github.com/microsoft/playwright) | 97,511 | Apache-2.0; existing test tooling and optional custom renderer |
| [Puppeteer](https://github.com/puppeteer/puppeteer) | 95,680 | Apache-2.0; alternative headless browser, not needed alongside Playwright |
| [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | 94,023 | Open-core, directory-specific licenses; product reference |
| [html2canvas](https://github.com/niklasvh/html2canvas) | 31,925 | MIT; local capture candidate, optional transitive dependency already present |
| [jsPDF](https://github.com/parallax/jsPDF) | 31,308 | MIT; existing PDF assembly, advisory review required |
| [Gotenberg](https://github.com/gotenberg/gotenberg) | 13,267 | MIT; preferred remote service spike |
| [html-to-image](https://github.com/bubkoo/html-to-image) | 7,253 | MIT; alternative capture candidate, evaluate same fixtures |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 4,921 | MIT; reference pagination/visual tests, avoid unnecessary wrapper |

Stars are a discovery signal, not quality/security evidence. html2canvas's last
push was July 2024. Browserless has SSPL/commercial licensing; wkhtmltopdf is
archived, so neither is the default. Review license/version before borrowing code.

## Delivery sequence

Each scoped feature branch starts from current develop and opens a PR into develop.
Do not merge or release implicitly. Follow AGENTS.md for branch cleanup.

| Step | Scope | Acceptance gate | Status |
| --- | --- | --- | --- |
| 1 | Local engine/isolation and HTML to Image MVP | Real images on all 3 engines, no script/network leak, bounded inputs and recovery | In progress on feature/html-to-image |
| 2 | Local assets/fonts/break-aware refinement | Explicit supported asset policy, decoding limits, fidelity fixtures | Planned |
| 3 | Targeted PDF dependency/security baseline | Patched supported versions, existing image-to-PDF regression tests | Required before HTML/PDF |
| 4 | HTML to PDF snapshot | Page count/size/margins/ranges verified on downloaded PDFs; raster label | Planned |
| 5 | Remote service spike | Measured latency/resource budgets, funding/hosting plan, isolation/egress policy | Planned |
| 6 | Web to Image | Real gateway-renderer-download tests, SSRF/cancel/quota coverage | Planned |
| 7 | Web to PDF | Native text extraction, print/screen styles, paper/margins/ranges | Planned |
| 8 | Advanced controls individually | Lazy/fixed/cookie heuristics have bounds, explicit opt-in and fixtures | Planned |

Current jsPDF lock version 3.0.3 falls in an official vulnerable range. Review
[GHSA-wfv2-pwc8-crg5](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5)
and all other current advisories; this advisory fixes output HTML injection in
>=4.2.1. Do not claim current output(blob) usage is proven exploited. No new
jsPDF usage is needed for HTML to Image. npm audit research attempt did not finish;
do not present it as a fresh complete audit. Do not bulk-update dependencies.

## First MVP contract

Static text/table/list HTML with safe inline styles, paste/upload, sample, explicit
preview/convert, PNG/JPEG, fixed width/height, scale, background/transparency,
filename, cancel/reset and recovery. Clip to selected dimensions with clear copy.
Do not promise full-page capture. No arbitrary JS, stylesheet imports, external
assets, embedded frames, ZIP bundles, URL input or backend. Restrict assets further
if decoding isolation cannot be verified. Unsupported content must be disclosed.

Core module: src/features/web-conversion/. Small meta/page adapters live beside
existing image tools. Existing folders/services are not reorganized. Registry,
related English locale keys, SEO metadata and focused CI are sync hotspots.
Use MUI teal theme, Quicksand app UI, rounded input/result cards and light/dark.
Input/editor and result stack on mobile. Avoid a new global UI system.

Preview/export only on explicit action. Inherited ToolContent auto-compute must
not start capture on every input change. Immutable job snapshots, run IDs and
AbortSignal prevent late outputs; editing/reset/unmount invalidates results.
Progress stages rather than fabricated percentages; no content persistence.

Sanitize detached HTML, filter CSS/assets and build controlled document before
rendering. Never raw HTML in parent React DOM. Parent-accessible capture frame may
use sandbox allow-same-origin without allow-scripts; opaque-origin preview does
not permit parent DOM capture. Do not combine both permissions. CSP/resource
policy must also apply to the cloned document. DOMPurify alone is not a CSS or
network policy. Test scripts, handlers, base/meta, srcset, SVG, CSS import/url/font,
forms and navigation. [MDN iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).

html2canvas is a DOM renderer, not a native browser screenshot or a real worker.
Use safe supported CSS, bounds and a single job; cancellation cannot preempt a
synchronous browser layout. Abort removes owned resources and discards late
results. Do not advertise hard CPU/memory quotas. [Limitations](https://html2canvas.hertzen.com/documentation/).

Initial conservative budgets must be verified by fixtures before shipping.
Measure input bytes/nodes/depth, CSS/geometry, canvas pixels and output bytes.
Avoid giant canvas and check decoded images before capture. Runtime defaults,
their rationale and actual cross-browser evidence belong in feature docs.

## PDF and remote architecture

Local canvas PDF is raster, not searchable/selectable; disclose this. Native
print is user-directed and cannot guarantee a downloaded file. Use Chromium
service for higher-fidelity PDF; do not promise PDF/UA from default browser output.
[html2pdf.js limits](https://github.com/eKoopmans/html2pdf.js#known-issues).

React SPA -> bounded gateway -> private Gotenberg/Playwright renderer -> bounded
result/download. Keep browser credentials/secrets server-side; endpoint config
is not a secret. Pages can call a separately hosted service with restricted CORS.
Open-source engine still has CPU/RAM/hosting cost. No paid API/backend in local MVP.

Gateway must validate protocol/credentials/options, restrict quotas/concurrency,
own jobs/downloads and kill cancelled/timed-out jobs. Fresh browser contexts,
non-root sandboxed containers, no host network/secrets. Enforce SSRF policy for
redirects/subresources/IPv4/IPv6/metadata, bind connections to validated DNS/IP,
and use network egress controls. Do not expose raw Gotenberg/DevTools. Private-IP
protection flags are not assumed secure by default. Pin engine image/version.
[Gotenberg filtering](https://gotenberg.dev/docs/outbound-url-filtering),
[OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

Cookie removal, fixed-position changes and lazy loading are best-effort options,
not guarantees. Never import user cookies or bypass login/CAPTCHA. Readiness uses
bounded DOM/fonts/images/selector checks, not endless networkidle waits.

## Test plan

- Unit: blank/BOM/Unicode/snippet/full/malformed HTML, byte/node/depth limits;
  malicious tags/attributes/CSS/URLs, filenames, dimensions/scale/quality,
  NaN/Infinity/boundaries and state/cleanup transitions.
- Local integration: Vietnamese invoice, table/list/code, embedded/missing assets,
  unsupported CSS warnings, light/dark isolation, oversized geometry and recovery.
- Browser: real paste/upload -> preview -> options -> convert -> download -> decode
  PNG/JPEG, check dimensions/signatures/pixels. Cancel/edit/reset/navigation,
  double submit, keyboard/focus/mobile/zoom and no stale download. Intercept content
  network leakage, including renderer clones; app assets/i18n are legitimate requests.
- PDF: downloaded document parsed by pdf-lib; count/media boxes/ranges correct,
  pdfjs visual rasterization not blank or missing pages. Test ranges empty/reversed/
  duplicate/out-of-document, excessive margins, long rows and page boundaries.
- Remote: controlled public/private/redirect/DNS fixtures, SPA/fonts/lazy/polling,
  invalid TLS/403/login/unreachable, crashes/queue/quota/output caps, ownership/TTL,
  timeout/cancel kills backend work. Real gateway + pinned renderer, not mocks only.
- Chromium/Firefox/WebKit; desktop WebKit is not real iOS Safari. Later real mobile
  smoke before claiming mobile capture support. Deterministic fixture assets/fonts;
  no live-site golden tests or byte-identical timestamped PDFs.
- Typecheck, required unit tests, production/Pages builds, metadata/sitemap/static
  routes/404, Pages prefix/noindex, text-style and whitespace checks. No test skips
  or retries/deadline relaxation to conceal failures.

## Completion evidence

Update this section after implementation and validation, distinguishing local
results, CI head and merged state. Engine spike failure is a reason to reduce
scope or change adapter, not to ship misleading controls. Do not mark all four
converters complete after one mocked successful download.
