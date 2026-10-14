# Web and HTML conversion plan

Research snapshot: October 12, 2026. Base inspected: develop at 31fb8ac.
Local conversion MVP is merged and verified on develop via PR20. Full Web
conversion remains incomplete: uploaded fonts and remote URL features are tracked in [the deferred register](WEB_CONVERSION_DEFERRED.md).
This document distinguishes current local contracts from future delivery. Agent execution
rules are defined in AGENTS.md and its required skills.

## URL-first product direction and discovery correction

User decision, October 14, 2026: the primary Web conversion journey is URL ->
conversion/preview -> download. Local HTML file/snippet tools are experimental
utilities for technical users, not a substitute for website URL conversion.
PR20 is merged into develop, which does not imply release to main/production.
PR21 security remediation is also merged; historical audit snapshots below are
not current security status (see SECURITY_REMEDIATION.md).

Milestone A is implemented on feature/web-conversion-ux for review, not merged:
category CTAs use editorial choices (Split PDF and Resize Image) independent of
registry insertion order; browse/related lists retain existing relative order
with local HTML tools last. Search relevance and user bookmarks are unchanged.
Local pages advertise experimental file/snippet input, upload and sample options,
not URLs. Routes, renderers, budgets, presets and actual export remain available.
Sync hotspots: one tools/index.ts integration, shared HTML UI, relevant English
locale blocks and two SEO descriptions. New curation logic/tests are isolated.

| Milestone | Scope and acceptance | State |
| --- | --- | --- |
| A | Correct discovery/copy, keep local upload/paste/sample flows and actual exports; no URL CTA without a service | Implemented on current feature branch, pending review |
| B | Decide renderer architecture, isolation/SSRF controls, measured resource budgets, hosting and monthly cost | Planned/deferred; no service selected or running |
| C | URL to PDF MVP with real gateway/renderer/download, cancellation, security/fidelity fixtures and actionable errors | Deferred until B is accepted and operation is authorized |
| D | URL to Image and advanced options, each with bounded readiness/fidelity tests | Deferred until URL PDF MVP meets its gate |

Milestone B compares maintained Playwright/Puppeteer (Apache-2.0) custom workers
and Gotenberg (MIT) against native PDF fidelity, screenshot support, isolation,
versions/advisories, deployment footprint and measured operating cost. Existing
star counts do not select the service. Recheck licenses/versions when reopening.
Keep the SPA static; renderer jobs use a controlled separate service and gateway,
not SSR or a public CORS proxy. Netlify/Pages hosting alone provides no such service.

MVP should accept public HTTP(S) URLs only; no uploaded cookies/authenticated pages
or arbitrary custom scripts. Validate DNS/IPs before connection and after redirects;
apply egress controls to every subresource, block private/internal/link-local and
metadata destinations, unsafe protocols and DNS rebinding. Browser contexts/jobs
need isolation, concurrency/rate limits, bounded redirects/time/resources/output,
backend cancellation and cleanup of temporary files. Do not expose browser or
Gotenberg endpoints directly. Handle login, anti-bot, paywall and render failures
with explicit errors, without bypassing access controls.

Before milestone C: benchmark latency/CPU/RAM, define numeric quotas and retention,
calculate hosting/egress/browser costs, decide abuse controls and verify browser
-> gateway -> renderer -> bounded download with SSRF fixtures. No measurements,
funding, completion date or backend deployment are implied by this document.
Local uploaded fonts remain deferred and do not take priority over this URL-first
product decision. Existing local contracts below remain supported as documented.

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
| [Gotenberg](https://github.com/gotenberg/gotenberg) | 13,267 | MIT; remote service candidate, selection deferred to milestone B |
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
| 1 | Local engine/isolation and HTML to Image MVP | Real images on all 3 engines, no script/network leak, bounded inputs and recovery | Merged into develop via PR20 |
| 2 | Local assets/system fonts/single-image boundary refinement | Asset limits, safe font stacks, crop/row warnings and strict export with fidelity fixtures | Merged into develop via PR20; multi-page pagination belongs to step 4 |
| 3 | Targeted PDF dependency/security baseline | Patched supported versions, existing image-to-PDF regression tests | jsPDF 4.2.1 and regression coverage merged into develop via PR20 |
| 4 | One-page HTML to PDF raster | Actual page size, margins, image placement/pixels and raster label | Merged into develop via PR20 |
| 4b | Bounded multi-page raster PDF | Width-fit, atomic block/row rejection, sequential captures and actual PDF seam assertions | Merged into develop via PR20 |
| 4c | PDF page ranges | Bounded syntax, source/output mapping and actual selected-page PDFs | Merged into develop via PR20 |
| 4d | Repeated table headers | Header-aware bounded plans, locked columns and actual continuation-page PDF pixels | Merged into develop via PR20 |
| 4e | Validated local option presets | Real PNG/JPEG/PDF outputs, preserved input/filename and cancelled stale work | Merged into develop via PR20 |
| 5 | Remote service spike | Measured latency/resource budgets, funding/hosting plan, isolation/egress policy | Blocked - hosting/funding/operations authorization required; see WEB_CONVERSION_DEFERRED.md |
| 6 | Web to PDF | Real URL/gateway/renderer/download, SSRF/cancel/quota coverage and native text fidelity | Deferred until milestone B; see WEB_CONVERSION_DEFERRED.md |
| 7 | Web to Image | Actual screenshot/download and bounded readiness/security fixtures | Deferred until URL PDF MVP; see WEB_CONVERSION_DEFERRED.md |
| 8 | Advanced controls individually | Lazy/fixed/cookie heuristics have bounds, explicit opt-in and fixtures | Deferred - see WEB_CONVERSION_DEFERRED.md |

The inspected develop baseline used jsPDF 3.0.3 in an official vulnerable range. Review
[GHSA-wfv2-pwc8-crg5](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5)
and all other current advisories; this advisory fixes output HTML injection in
>=4.2.1. Do not claim current output(blob) usage is proven exploited. No new
jsPDF usage is needed for HTML to Image. The initial research audit request did
not finish; implementation later verified the baseline and final registry reports.
Do not bulk-update dependencies.

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

These local capture engines are DOM renderers, not native browser screenshots or real workers.
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

HTML to Image is merged into develop via PR20. Engine spike
found html2canvas stuck in WebKit's script-disabled sandbox clone. The selected
adapter uses html-to-image 1.11.13 (MIT, no runtime dependencies), lazy-loaded only
when converting. Existing html2canvas remains an optional dependency of jsPDF;
no direct html2canvas dependency was added. Its scripts remain disabled; no unsafe
fallback or longer deadline was used. This is a compatibility decision supported
by real-browser output tests, not a claim of universal CSS fidelity.

Current budgets: 64 KiB UTF-8 input, 1000 processed nodes, depth 24, dimensions
320..1280 by 100..1080, scale 1/2, 2 MP output, 8 MiB encoded result. Input styles
are rebuilt from a small allowlist in an inert template before DOMPurify. Only
base64 data-URL PNG/JPEG images are accepted; SVG/GIF/APNG, style blocks, imports,
active markup and external assets are removed or rejected. The source
document uses system fonts; the app keeps its existing Quicksand/MUI theme.

DOMPurify was updated from 3.4.2 to pinned 3.4.16 because the feature uses it
directly. Baseline develop had 63 audit findings; the final lockfile has 62
(7 critical, 37 high, 16 moderate, 2 low), with no finding for DOMPurify or
html-to-image. The targeted jsPDF upgrade subsequently reduced this to 61
(6 critical, 37 high, 16 moderate, 2 low), with no jsPDF finding. Remaining
advisories are inherited and not resolved by this PR.
The broad dependency/security task remains separate backlog work; the targeted
jsPDF gate described below is narrower.
Tool UI copy is English; existing metadata uses the project's English fallback.

Renderer frames use allow-same-origin without allow-scripts. The deadline is a
10-second asynchronous wait bound, not a hard CPU quota. Abort removes the owned
frame, discards late output, and zeros a late canvas; it cannot interrupt an
in-progress synchronous layout or encoding. Output is fixed-size and cropped.
Embedded images are limited to 4, 48 KiB combined compressed data, 1024 px per
side, 500000 pixels per image and 1000000 pixels combined. PNG chunk bounds/CRC
and JPEG frame/segment bounds are checked before assigning a source or native
decode. PNG permits 1/2/4/8-bit static files and a small metadata allowlist;
compressed metadata and unknown chunks are rejected. JPEG permits single-frame
8-bit baseline/progressive files. Browser decoding verifies header dimensions
before preview/export. A 5-second asynchronous validation deadline and abort
discard late results; every resolved bitmap is closed, including late results.
Native decode itself cannot be preempted and these checks are not hard memory
quotas. The capture CSP permits only data images; scripts and network remain
blocked. One-page and bounded multi-page HTML/PDF are implemented on branch; repeated headers and page ranges are implemented on branch; URL conversion remains deferred. The narrow jsPDF dependency
gate is implemented on branch, subject to exact-head CI and review. Embedded/custom fonts and full-page capture are outside the current
local-image contract.

Validation evidence and the exact CI head are recorded in the feature PR. Tests
decode actual PNG/JPEG bytes and verify dimensions, transparency, colors and
scale; browser tests also cover hostile content/network isolation and dark/mobile
flows. Embedded PNG/JPEG fixtures verify actual raster pixels in preview and
download, oversized headers fail before native decode, and stalled decode tests
verify timeout/cancel/recovery. Unit sanitizer tests use normal attribute names because happy-dom 12 has
a parser error for id=constructor; the exact DOM-clobbering payload is tested in
real Chromium/Firefox/WebKit without removing the security assertion.

Sync hotspots: image generic registry (2 lines), English image metadata (new key),
SEO override registry (2 lines), focused Pages CI (one command), package/lock and
the isolated new module/page/SEO files. Existing tool services, Netlify settings,
SSR/routing and other locales are untouched. License notice is shipped under
public/licenses/html-to-image.txt. More assets/full-page/PDF support needs separate
scope and tests; do not mark all four converters complete from this MVP.

## Single-image fidelity and boundaries

Step 2 now covers the supported local-image contract: bounded PNG/JPEG assets,
system font stacks and explicit crop boundaries. This is implemented on the
develop via merged PR20. Safe stacks accept Arial, system-ui, serif,
sans-serif and monospace, including comma-separated fallbacks and quoted names.
Font appearance depends on the host OS; do not claim identical glyph metrics.
Bounded border longhands are preserved because browser CSSOM expands shorthand
borders; otherwise default table borders can change dimensions and boundary cuts.
Custom/embedded fonts and external font requests remain unsupported. Unknown
font families and page-break CSS are removed with the existing style warning.

Preview and capture inspect the real script-disabled frame's layout, including
descendants of fixed-height wrappers. Warn for horizontal/vertical overflow and
table rows crossing the bottom edge; rows wholly below the edge cause overflow
without being counted as split rows. Allow half a CSS pixel for rounding. Exact
boundaries fit; output scale changes pixel count, not CSS layout boundaries.
Each explicit preview reloads its frame and stale onload callbacks are ignored.

Default Allow cropping preserves existing output. Stop if content is cropped
rejects export before invoking the image engine, cleans the frame and lets users
resize/shorten input or explicitly allow cropping. The preview remains available
for inspection. This measures element/scroll boxes, not individual glyph outlines;
subpixel rounding and platform font differences are not universal visual proofs.

No automatic page splitting, break-inside handling or moving table rows is
promised for one-image output. Multi-page pagination, repeated table headers and
oversized-row policy belong to the PDF phase after its dependency/security gate.
The original break-aware refinement goal is satisfied here by detection and an
explicit stop policy; page assembly must be tested against actual PDFs later.

Regression fixtures cover exact/crossing/omitted rows, fixed-wrapper and horizontal
overflow, unsupported fonts/breaks, 2x scale, preview/export color fidelity,
repeated preview, strict rejection and successful recovery after resizing.

## Targeted PDF baseline

jsPDF is pinned from 3.0.3 to 4.2.1 (MIT), the official latest release checked on
October 12, 2026. Only its required @babel/runtime changed (7.28.4 -> 7.29.10,
meeting the new ^7.28.6 range); no bulk dependency update. DOMPurify remains
3.4.16. v4.0.0 disables filesystem access by default in Node; the official
release lists no other breaking change. Browser consumers need no API migration.
Do not enable allowFsRead. [v4.0.0](https://github.com/parallax/jsPDF/releases/tag/v4.0.0),
[v4.2.1](https://github.com/parallax/jsPDF/releases/tag/v4.2.1).

At the dependency baseline phase, the only runtime jsPDF import was
pdf/convert-to-pdf/service.ts: constructor,
setDisplayMode, addPage, pageSize getters, addImage and output('blob'). It accepts
browser image elements, not filesystem paths. Split Image to Pages uses pdf-lib
1.17.1 and stays unchanged. No new HTML, annotations, AcroForm, addJS or metadata
API usage. Fix failed-image object-URL cleanup, show existing consumer failures
through its snackbar and clear completed output on Clear. No consumer rewrite.

Official advisories affecting 3.0.3 are patched by the selected release:

| Advisory | Topic | Patched version in advisory metadata |
| --- | --- | --- |
| [GHSA-f8cm-6447-x5h2](https://github.com/parallax/jsPDF/security/advisories/GHSA-f8cm-6447-x5h2) | Node filesystem traversal | 4.0.0 |
| [GHSA-cjw8-79x6-5cj4](https://github.com/parallax/jsPDF/security/advisories/GHSA-cjw8-79x6-5cj4) | addJS shared state | 4.0.1 |
| [GHSA-pqxr-3g65-p328](https://github.com/parallax/jsPDF/security/advisories/GHSA-pqxr-3g65-p328) | AcroForm injection | 4.1.0 |
| [GHSA-vm32-vv63-w422](https://github.com/parallax/jsPDF/security/advisories/GHSA-vm32-vv63-w422) | XMP metadata injection | 4.1.0 |
| [GHSA-95fx-jjr5-f39c](https://github.com/parallax/jsPDF/security/advisories/GHSA-95fx-jjr5-f39c) | BMP dimensions DoS | 4.1.0 |
| [GHSA-p5xg-68wr-hm3m](https://github.com/parallax/jsPDF/security/advisories/GHSA-p5xg-68wr-hm3m) | AcroForm radio children | 4.2.0 |
| [GHSA-67pg-wm7f-q7fj](https://github.com/parallax/jsPDF/security/advisories/GHSA-67pg-wm7f-q7fj) | GIF dimensions DoS | 4.2.0 |
| [GHSA-9vjf-qc39-jprp](https://github.com/parallax/jsPDF/security/advisories/GHSA-9vjf-qc39-jprp) | addJS PDF injection | 4.2.0 |
| [GHSA-wfv2-pwc8-crg5](https://github.com/parallax/jsPDF/security/advisories/GHSA-wfv2-pwc8-crg5) | HTML output injection | 4.2.1 |
| [GHSA-7x6v-j9x4-qf24](https://github.com/parallax/jsPDF/security/advisories/GHSA-7x6v-j9x4-qf24) | Annotation color injection | 4.2.1 |

GHSA-cjw8 lists 4.0.1 as patched in advisory metadata while v4.1.0 release notes
list its fix. The selected 4.2.1 exceeds both; do not assume the metadata proves
a 4.0.1 release was published.

Older GHSA-8mvj-3j78-4qmw and GHSA-w532-jxjh-hjhj were already patched before
3.0.3. Advisories affect library API ranges; this is not evidence of exploitation
of this app's blob output flow. The historical PR20 npm audit reported 61 remaining package findings,
including 6 critical. No claim of a clean repository or universal PDF security.

Regression tests parse real jsPDF bytes for page count, portrait/landscape,
full-size and A4 dimensions, PNG soft masks, page image references, centered
scale/margins, Unicode filenames, failed decode cleanup, invalid/mixed input and
recovery. Browser flows download actual PDFs and pass them through the existing
PDF.js PNG tool to verify pixels and nonblank pages. The unchanged pdf-lib split
flow has four-page/edge-padding regression coverage. No mock PDF encoder.

Existing Images to PDF still auto-computes and has no hard input/batch/decode quota
or generation-token cancellation. Split Image to Pages does not fully guard
invalid numeric options/resource expansion. These inherited reliability gaps need
separate scope; jsPDF's 14400-point page ceiling is not an input or memory quota.
HEIC/WebP/GIF conversions are not covered by the new PNG/JPEG fidelity fixtures.
The dependency/API baseline gate is narrow, not proof that all legacy PDF
consumers have resource quotas or cancellation.

The following planned scope is now merged into develop via PR20 for one page:
local raster HTML to PDF in the isolated conversion module,
with explicit page-size/orientation/margins, bounded page/pixel/output counts,
strict option validation, safe static assets and existing job cancellation. Label
text as non-searchable/non-selectable. Start with one-page fidelity and actual
PDF.js raster assertions; ranges, multi-page splitting, repeated headers and
oversized-row behavior require explicit acceptance criteria before implementation.
The new implementation uses addImage and blob output; no jsPDF.html or remote
rendering has been added.

Sync hotspots added by this baseline: package/lock, the two existing Images to
PDF files (decode cleanup and local error/clear handling), one focused CI command
and these docs. Test helpers stay under the isolated module; no tool registry,
locale, Netlify, route or production policy changes.

## One-page HTML to PDF contract

Merged into develop via PR20: /pdf/html-to-pdf. The shared
HTML conversion UI has an explicit PDF adapter; image mode keeps its existing
controls and outputs. The same sanitizer, embedded asset policy, capture frame,
CSP, crop inspection, jobs and resource cleanup are reused. PDF.js is used in
tests through the existing PDF to PNG tool, not in the PDF export runtime.

A4 is 210 x 297 mm; Letter is 215.9 x 279.4 mm. Orientation swaps page dimensions.
Each margin accepts finite decimal values from 0 to 100 mm; the printable area
must be positive. These paper/margin bounds also keep printable sides above
zero. Out-of-budget margins that would collapse the page are rejected before
capture. Viewport width/height remain 320..1280 / 100..1080 CSS px. Scale is 1/2.

Fit coefficient = min(printableWidth / viewportWidth, printableHeight /
viewportHeight), in mm per CSS pixel. Keep aspect ratio, center inside printable
space, and convert mm to PDF points using 72 / 25.4. Scale multiplies raster
pixels only; page geometry and placement do not change. The preview displays a
white paper board at 2 CSS px/mm with the same fit/offsets, in a scrollable panel.
It is a supported-layout preview, not a native PDF viewer or a glyph-identical
promise across operating systems. Cropping applies to the fixed HTML viewport;
strict mode rejects viewport overflow before image capture. This One page mode does not paginate. Paginated mode is described below; optional repeated headers and ranges apply only to Paginated mode. CSS page breaks remain unsupported.

Input/DOM/assets retain existing limits: 64 KiB UTF-8, 1000 nodes, depth 24,
4 embedded PNG/JPEG images, 48 KiB combined file data and 1 MP combined source
pixels. Capture is at most 2 MP and 8 MiB PNG; PDF output is one page and at most
8 MiB. PNG headers/dimensions are checked again before jsPDF assembly. PNG input
at this stage is owned renderer output, not an arbitrary user-uploaded PNG API.
PNG alpha is kept as a PDF soft mask; PDF paper and the preview board are white.
Unused font resources are omitted. Text is raster, not searchable/selectable.
Default OpenAction is jsPDF's local FitH page destination, not executable code;
no JavaScript actions, annotations, external resources or custom metadata APIs
are introduced.

Asset validation retains its 5-second async deadline. Capture retains its
10-second async deadline; PDF assembly has its own 10-second async deadline
covering byte reading/module loading, with elapsed-clock checks before/after
synchronous work to discard late output even if a timer callback was delayed.
Check abort/ownership before and after
asynchronous boundaries and before/after synchronous encoding; reject late
outputs/errors. DOM layout, native decode and synchronous jsPDF/PNG work cannot
be interrupted by a timer and have no hard CPU/memory quota. Input/options edits,
reset and unmount abort owned jobs. Owned frames, bitmaps, listeners, timers,
canvases and result blob URLs follow the existing cleanup. Encoding arrays and
jsPDF objects are local and released for garbage collection, not explicit disposals.

Tests use real jsPDF bytes with read-only pdf-lib metadata inspection, verify
geometry, draw matrices, alpha, safe catalog/view resources, page count and
filenames, including ASCII/C1/bidi control filtering for PDF downloads. Real UI flows download and rasterize with PDF.js, checking paper
margins, logo/text/table ink, embedded PNG/JPEG, transparency and 2x resolution.
Security cases include preview/capture network/script/navigation isolation.
Deferred unit promises exercise double-submit, margin/input edits, late errors,
encoding timeout/cancel, unmount, reset and recovery. Browser flows also compare preview bounds/offsets against the downloaded PDF
draw matrix and exercise client-side route unmount during a pending job. They
cover invalid HTML/options, strict crossing rows, unsupported native decode, mobile/dark and
keyboard conversion. Exact run/head results belong in the PR.

New sync hotspots: two lines in the PDF tool registry, related English PDF locale
key, two SEO override lines, focused CI command and small shared converter/model
integration. Core and test additions remain under src/features/web-conversion/;
new page/meta/content adapters follow existing conventions. Netlify settings,
production policy, unrelated services/locales and directory structure are unchanged.


## Bounded multi-page raster PDF contract

Merged into develop via PR20. One page remains the default
and retains contain-fit/centering, fixed viewport and crop policy. Paginated is
an explicit separate mode. It ignores the disabled viewport-height/crop controls.
Paper, orientation and 0..100 mm finite decimal margins use the same validation.

Paginated layout uses a fixed 320..1280 CSS px source width. The coefficient is
printableWidth / sourceWidth mm per CSS pixel (points = mm * 72 / 25.4).
Capacity = floor(printableHeight / coefficient) CSS px. Scale 1/2 multiplies
raster pixels only and never changes source boundaries. A partial last page is
placed at left/top margins at the same coefficient, with white paper below;
it is never stretched or fit to the whole page.

The planner emits integer, continuous [start,end) source slices. It retreats
from a crossing protected range to floor(range.top), checking other overlapping
ranges until safe, or rejecting a non-progressing layout. No pixels are omitted
between slices; whitespace inside the retained source is preserved. Unpainted
trailing empty wrappers are excluded from printable height, but still included
in the geometry budget. Explicit heights of visible leaf blocks, painted
backgrounds and intentional leading/inter-block whitespace remain meaningful.
Completely hidden/empty printable content is rejected rather than exporting an
accidental blank page. Measurement covers descendants overflowing fixed-height
wrappers and rejects horizontal overflow. It measures element/scroll boxes,
not universal glyph outlines.

Supported break subset: leaf text/heading/list/code blocks and simple table rows
inside structural wrappers. Direct anonymous text is protected by its Range
bounds. Rowspan/nested tables are atomic. Overlapping atomic ranges that cannot
be safely divided are rejected. A block/row taller than capacity is rejected
with a shorten/increase printable height/use One page message. There is no
explicit split option. Nested/flex layout fidelity is not universally promised.
Existing sanitizer removes break-inside/page-break CSS with an unsupported-style
warning; these properties are not silently interpreted as pagination commands.
Optional repeated table headers and page ranges are described below. No custom
fonts or remote URL rendering.

Budgets: 8 pages, 10000 CSS px measured source extent, 4 MP per captured page,
16 MP cumulative raster pixels, 8 MiB cumulative PNG captures and 8 MiB actual
PDF output. Input 64 KiB/1000 nodes/depth24 and embedded assets 4/48 KiB/1 MP
remain unchanged. Pixel and source budgets are checked before capture. Encoded
PNG/PDF byte budgets are checked between pages before another canvas is started.
These are acceptance bounds, not hard browser/native allocation or memory quotas.

A script-disabled, data-only CSP frame contains a trusted flow-root wrapper;
measurement and preview/export share this wrapper to avoid margin-collapse
differences. A bounded body viewport clips the source translated by -start CSS
pixels. html-to-image serializes the safe DOM into its SVG clone and creates
only a per-page canvas, never a full-document canvas. Captures/encoding are
sequential; each canvas is zeroed before the next page. PNG headers/dimensions
are revalidated. jsPDF addImage uses supported FAST PNG compression to keep
multi-page 2x files within the existing cap; no HTML/actions/annotation APIs.
jsPDF retains compressed image data until completion and has no dispose API.

Preview shows page count, source bounds and paper/margins using the same pure
planner and width-fit coefficient. Export remeasures the immutable input/options
snapshot in a fresh owned frame before capture. System-font layout can differ
across operating systems; this is not a native PDF viewer or byte/glyph identity
promise. Actual browser tests compare preview bounds to emitted image dimensions
and matrices, then rasterize every downloaded page with PDF.js.

One paginated render has a 10-second async deadline after asset validation, with
elapsed monotonic checks before/after DOM measurement, async capture, byte reads,
per-page PDF encoding and final output. Abort/timeout removes the owned frame,
clears timers/listeners, zeros current/late canvases and discards late callbacks.
Input/options/mode edits, cancel/reset and SPA unmount cancel job ownership.
Progress reports measurement/capture page counts, never invented percentages.
DOM layout, native decode and synchronous jsPDF work cannot be preempted; no hard
CPU/memory quota is claimed. Local encoding arrays/PDF objects are GC-owned.

Official jsPDF release/advisories were rechecked October 13, 2026: 4.2.1 remains
latest and exceeds published affected ranges. No dependency change in this phase.
Focused CI includes pagination browser coverage alongside existing image, one-page
PDF and legacy PDF regressions. Exact checks/head and audit counts belong in PR20.
Sync hotspots: shared local HTML UI, the existing related English PDF description,
SEO content, focused Pages CI and these docs. Core/planner/test additions stay in
src/features/web-conversion; no deployment/routing policy or unrelated services.


## Paginated page selection

Merged into develop via PR20. All pages is the default.
Custom ranges refer to 1-based pages in the complete source plan: 1, 1-3 or
1,3,5-7. Whitespace around tokens/dashes is accepted. Leading zeroes normalize
to their positive integer page. Duplicate/overlapping/unsorted entries normalize
to unique pages in ascending source order. Empty custom input, malformed tokens,
zero/negative/decimal/nonfinite/unsafe numbers, decreasing ranges and pages outside
the source document are errors; no clamp, dropped token or All pages fallback.

Parser bounds are 128 UTF-8 bytes and 16 tokens. Endpoints must be safe integers
1..8 before expansion, so a huge endpoint never controls allocation/iteration.
The input keeps one over-limit character to report rejection rather than silently
exporting a valid truncated prefix. Syntax is checked on explicit actions;
actual source bounds are checked after the full immutable document is measured.
Typing does not trigger measurement, capture or conversion.

Full source/input/asset/page/pixel budgets still apply before selection. Selecting
page 1 cannot bypass an oversized source or unselected raster-budget overflow.
Only selected slices are captured sequentially; cumulative encoded PNG and actual
PDF byte limits apply to those captures. Each slice keeps original source bounds,
width-fit coefficient, margins and raster scale. Export page 1 can be source page 2
without a leading blank page. No reflow, repagination, post-export deletePage or
full-document canvas. All pages retains the original capture sequence/geometry.

Preview reports total source pages, normalized selection and export count. Each
paper is labelled with source number and output position; progress reports the
same mapping. Range edits cancel the old job, clear plan/output/URLs and ignore
late plans/progress/results/errors. No extra snapshot cache was introduced.
One page hides and ignores range controls; Reset restores One page plus All pages.
Restore default options clears custom ranges while retaining the chosen layout.

Baseline review found an assembler validation defect: rebuilding artificial
unbroken pages could exceed 4 MP even when protected breaks produced acceptable
pages. Reproduced with width 1000, scale 2 and three 800-px blocks: each accepted
slice is 3.2 MP, total 9.6 MP, while a natural unbroken page exceeds 4 MP.
Geometry is now validated independently, followed by every original slice's
continuity/capacity/source and pixel budgets before range resolution. Budgets are
unchanged; this removes an incorrect rejection, not the planner's limits.

Tests cover parser boundaries/invalid cases, full-plan quota enforcement before
selection, actual jsPDF page matrices/dimensions/alpha/resources and decoded image
streams matching selected source pages. Browser fixtures have four source pages
with unique markers/color bands; downloaded PDFs are parsed and rasterized with
PDF.js for single/nonconsecutive/inclusive/normalized/All selections. Cover
A4/Letter/orientation/asymmetric margins/1x/2x, invalid ranges and recovery,
selected capture edits/cancel, mobile/dark/keyboard, security isolation and SPA
unmount/readiness. Exact-head counts and CI evidence belong in PR20.

Sync hotspots: shared local HTML UI, PaginatedPreview, selected capture/assembly,
related SEO copy and focused CI. New parser/control/tests stay in the existing
feature module. No dependency, unrelated locale/service, deployment/routing,
SSR or folder-structure changes. Repeated headers are described below; custom fonts/URL conversion remain deferred. Native decode/layout/synchronous encoding retain
the documented cancellation and CPU/memory limitations.


## Repeated table headers

Merged into develop via PR20. Repeat table
headers is explicit, Paginated-only and defaults Off. One page is unchanged.
Reset and Restore default options clear the flag; option edits cancel ownership
and clear old preview/output. It never guesses the first body row as a header.

Supported: normal-flow native tables with a visible thead, body cells without
spans, multiple header rows and header colspan. At most 20 header-bearing tables,
20 columns and 128 descendant nodes per header. Native table/row/cell/group
displays are required. Nested tables, rowspan, body colspan, caption/tfoot, flex
ancestors and layout overrides reject when enabled with an actionable Off option.
Entirely hidden tables are ignored; visible empty/hidden headers reject when a
body exists. A table without thead uses ordinary pagination without repetition.

Measurement runs inside the owned script-disabled data-only CSP frame after
embedded images are ready. A shallow table clone contains only sanitized thead
and a trusted colgroup with original measured body-column widths. Font/color/
border properties are inherited explicitly; the nearest painted ancestor's
background is copied behind the header. Native probe cell widths, horizontal
positions and heights must match within 0.5 CSS px or the table rejects. Custom
fonts/external resources remain unsupported. No complete table/body clone is
created for repetition. Complex painted ancestor effects are not reproduced.

The pure planner keeps original header plus first body row together and includes
the last table border. On a continuation page it reserves the measured clone's
ceil-rounded height before finding the next row boundary. Header plus each body
row must fit printable capacity, including rounding allowance; no oversized row
splitting. Only a table continuing at the page start gets a synthetic header;
a subsequent table keeps its original header, and paragraph-only pages have none.
The complete header-aware plan is built and bounded before page ranges resolve.
Selected continuation pages retain headers without requiring their first page.

Preview/export use the same bounded composition: source is translated by -start
inside a separate overflow-hidden clip below the reserved strip. This prevents
preceding body rows leaking into the header. The header table is positioned at
its measured horizontal offset; each page gets a new header-only clone and the
last temporary wrappers are removed. Capture remains sequential and never
allocates a full-document canvas. Clone image decode and capture/encoding use
the existing job ownership, abort/deadline and elapsed checks. Preview errors
are visible; disconnected preview frames discard late failures.

Budgets remain 8 source pages, 10000 CSS px document extent, 4 MP/page, 16 MP
full-plan cumulative pixels, 8 MiB cumulative selected PNG and actual PDF output.
Synthetic header pixels count in page and full-plan raster budgets. Height in
PNG validation and PDF placement includes the reserved strip, preserving aspect
ratio and partial last-page scale. Assembly revalidates header/table geometry
and page references before range selection or capture. No runtime dependencies
or PDF active-content APIs were added. Native DOM/decode/synchronous encoding
remain cooperative, without hard CPU/memory quotas. Resource limits are not a
completion-time guarantee: a 7-8-page/2x header table reached the unchanged
10-second deadline on desktop WebKit. Fidelity fixtures use bounded smaller
workloads; a separate large-plan browser regression expires the monotonic clock
after a held continuation capture and checks timeout, frame/canvas cleanup,
no partial download and recovery. No deadline/retry increase. Pixel probes use
blank colored areas outside font-dependent glyphs; RGB tolerance stays 3.

Baseline reproduction: an ordinary 30-row table with default collapsed borders
returned Overlapping blocks instead of pages. Adjacent native row edges lie on
half pixels; integer-floor retreat could cascade to the table start, including
an unnecessary intro-only page. The planner now permits only row-edge rounding
within 0.5 CSS px. Actual overlapping blocks still reject. Firefox additionally
reports the collapsed table outer width as row/group scrollWidth, despite their
inner border boxes being 1 px narrower. Native collapsed row/group scroll checks
now compare against the actual table outer box; physical viewport and individual
cell/descendant overflow checks remain unchanged. Regression tests still reject
real group or cell overflow. Integer/source slices
remain contiguous with no omitted/duplicated source pixels; a shared border can
straddle the integer seam. This is not a promise of pixel-identical text across
browser engines/OS fonts.

Validation covers pure plans, paper/orientation/asymmetric margins/scale,
original-header grouping, multiple tables/paragraphs, invalid geometry, budgets,
forged/missing header references and actual jsPDF dimensions/matrices/alpha/safe
resources for selected continuation pages. Browser fixtures use multi-row colspan
headers, embedded PNG/JPEG, colored unique rows and collapsed borders; downloaded
PDFs are parsed and rasterized with PDF.js to check headers, column colors, every
row center/edge, order and last-page scale. Additional cases cover unsupported
tables, cancellation of a held continuation canvas, option edits, unmount,
mobile/dark/keyboard, malicious header scripts/assets and recovery. Exact tested
head, browser counts and remaining audit findings belong in PR20.

jsPDF official latest release/advisories were rechecked October 13, 2026:
4.2.1 remains the patched baseline. The PR20 historical registry audit reported 61 inherited
findings (6 critical, 37 high, 16 moderate, 2 low); none identify jsPDF, DOMPurify
or html-to-image. This does not claim the entire dependency graph is safe.

Sync hotspots: existing feature planner/renderer, shared HTML/PDF UI and
PaginatedPreview, related HTML/PDF SEO notes and focused Pages CI. New header
model/DOM helpers/tests remain in src/features/web-conversion. Netlify settings,
routing/canonical policies, upstream tool services and unrelated locales stay
unchanged. Custom fonts and URL conversion remain deferred; see WEB_CONVERSION_DEFERRED.md.

## Local completion and presets

Local MVP is implemented and verified on develop via merged PR20. This does not
complete arbitrary Web/URL conversion. Review exact-head checks in PR20 and the
[deferred register](WEB_CONVERSION_DEFERRED.md) before reopening another scope.

Six built-in option presets: square PNG 640x640, wide JPEG 960x540, portrait PNG
720x960, A4 portrait One page, A4 portrait Paginated and Letter landscape Paginated
(width 640). All use scale 1 and existing default background/quality/crop contracts;
PDF margins default to 10 mm. Templates contain options only, never HTML/assets/
fonts/output. No persistence or storage dependency. Unknown/cross-output IDs reject
without fallback. Existing validators run before application; image objects and
PDF margins are fresh snapshots on every use. Current input/filename are retained.

Applying a preset invalidates ownership/preview/output/URLs. PDF application
resets ranges to All pages and repeated headers Off; users can then edit options
explicitly. The selector is an action (Choose a preset), not a claim that subsequent
manual edits still match a preset. Applying options never measures/renders content.
Reset/default controls retain their existing behavior and budgets are unchanged.

New tests cover preset contracts, isolation, unknown IDs and deferred ownership;
browser flow decodes all image presets and actual A4/Letter PDFs, checks page
geometry/colors/Unicode filenames, input preservation, mobile/dark/keyboard,
held-capture cancellation and no auto conversion. Existing core/security tests
remain required. No renderer/dependency or production/Pages policy changes.

Sync hotspots for this phase: shared HtmlToImage UI, focused Pages CI and these
docs. Preset templates/controls/tests stay in src/features/web-conversion. Fonts
remain deferred pending validated local embedding; URL features are blocked on
remote isolation/operations/funding, not replaced by a CORS proxy.

## Review corrections: elapsed deadline acceptance

Merged into develop via PR20. Review reproduced timer-starved
capture accepting a PNG after 10.3 seconds and native validation accepting preview
after 5.24 seconds. These were controlled instrumentation probes, not untrusted
HTML executing scripts. Capture now checks a monotonic deadline at preparation,
module/capture/encoding boundaries and before returning a file. Native asset
validation checks before/after each decode and before accepting the entire phase.
Budgets stay 10 seconds for image capture and 5 seconds for shared asset validation;
existing pagination/PDF assembly deadlines stay unchanged. Timers still reject
stalled promises; elapsed checks reject late completion before timer delivery.
An exact elapsed boundary is accepted only while the phase is still active and
its timer has not fired; strictly greater elapsed time rejects. Timer delivery or
abort ends ownership independently. This is not preemption or a hard quota.

The captured canvas becomes owned before an elapsed check can throw. A canvas
arriving after timeout/cancel is zeroed without encoding. Decoded bitmap checks
run inside try/finally so every returned bitmap closes, including late results.
New unit regressions cover exact/past boundaries, shared decode deadlines, stalled
encoding, late canvas/bitmap cleanup and recovery. Real-browser regressions hold
native completion, advance only the monotonic clock, verify no late output and
then decode/download actual recovery images/PDFs on all three engines.

The previous headers UI unit test combined several flows under one 5-second test
budget and timed out in the default full run while passing isolated/serial runs.
It is now four independent tests with explicit renderer-entry acknowledgements and
semantic combobox lookup; no timeout/retry/global-worker settings are changed.
This reduces contention sensitivity without claiming every source of flakiness is
eliminated. HTML to Image FAQ now describes the existing separate raster-PDF tool,
matching UI and prerendered HTML. Fonts/remote scope remains deferred.

Sync hotspots for these corrections: existing feature capture/assets, header UI
tests, related SEO FAQ, focused Pages CI and docs. No budgets, dependencies,
sanitizer/CSP, deployment/routing policy or unrelated services/locales change.

## Review corrections: painted bounds and left overflow

Merged into develop via PR20. Pagination measurement now
retains empty boxes with visible borders, including trailing boxes, instead of
trimming them as whitespace. Transparent, zero-width and non-painted borders
remain eligible for whitespace trimming. A border-only leaf follows the existing
whole-block policy; oversized boxes reject instead of introducing implicit cuts.

Negative horizontal bounds now reject using the same half-CSS-pixel rounding
tolerance as right overflow. A narrow, end-aligned flex column can place a wider
child left of the viewport without increasing scrollWidth; relying on right bounds
and scrollWidth alone silently cropped its left side. Unit regressions reproduced
both omissions before the fix. Browser coverage verifies preview/page bounds and
actual downloaded PDF border pixels, left-overflow rejection, cleanup and recovery.

Sync hotspot: pagination-layout.ts only. Existing planner, renderer, budgets,
sanitizer/CSP, dependencies, One page behavior and deployment policies are unchanged.
