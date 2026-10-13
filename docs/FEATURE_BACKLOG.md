# Orvulix issue-backed feature backlog

Status: planned, not implemented by this document. Reviewed on October 11, 2026.

Source: [OmniTools open issues](https://github.com/iib0011/omni-tools/issues).
The review covered 57 open issues, current open PRs, and Orvulix `develop`.
Issue/PR states are a dated snapshot, not proof that a fix is complete or suitable.
Recheck upstream before starting each item. Priorities are relative; no delivery
dates, adoption metrics or Claude program approval are promised.

The `/roadmap` page shows user-facing summaries, proposed priority and Planned
status. Copy lives in `src/seo/roadmap.ts`, shared by React and static prerender;
update it alongside this ordered plan. Technical criteria stay in this document.

## Delivery rules

- Start from updated `develop`, implement on `feature/*`, and open PRs into
  `develop`. Do not push task commits directly to `develop` or open feature PRs
  into `main`. A production release requires separate authorization.
- Keep new features in isolated modules with small integration adapters. Do not
  reorganize inherited tool folders or bulk-format existing files. Document router,
  tool registry, shared UI, worker and locale hotspots when changes are necessary.
- Keep MVPs browser-local and free of paid AI APIs. Lazy-load heavy codecs/models,
  cap input/output sizes, expose cancellation, and clean up workers/object URLs.
  Loading remote assets still creates network requests; do not claim offline
  support until verified. Avoid saving user inputs by default.
- For each implementation, verify typecheck, meaningful unit/browser tests,
  production build metadata/sitemap and Pages base path/noindex. Never use a
  production deploy as a test. Remove the completed branch after authorized merge.
- Use regular hyphens (-), never Unicode U+2014. Run
  `node scripts/check-text-style.mjs` and preserve file formatting.

## Foundation work before new features

| Item | Evidence and scope | Acceptance criteria | Upstream to review |
| --- | --- | --- | --- |
| Timed regex execution in inherited list tools | [#377](https://github.com/iib0011/omni-tools/issues/377). This branch implements bounded regex execution for all 11 list tools with regex splitting, including Group at /list/chunk. Typed adapters retain existing transformations; Group and Duplicate also guard dangerous numeric options in both modes; regex preflight includes separators added by Group padding. See [architecture, limits and sync hotspots](BOUNDED_LIST_REGEX.md). | Catastrophic backtracking cannot freeze the UI; invalid syntax, cancellation, timeout and subsequent recovery work. Length limits alone are insufficient. | [PR #383](https://github.com/iib0011/omni-tools/pull/383), [PR #389](https://github.com/iib0011/omni-tools/pull/389), [PR #366](https://github.com/iib0011/omni-tools/pull/366). |
| PDF Editor privacy audit | [#301](https://github.com/iib0011/omni-tools/issues/301). Verify SimplePDF requests with a local fixture; distinguish asset downloads, analytics, fingerprints and document uploads. Existing privacy copy is not a network audit. | Document observed behavior. If integration sends data, disclose exact categories and require opt-in before loading it. Do not claim local-only without verification. | Recheck SDK behavior/version and upstream discussion before changing it. |
| Clipboard regression triage | [#390](https://github.com/iib0011/omni-tools/issues/390). Reproduce formatted-output copying on HTTPS and self-hosted HTTP; do not assume all upstream clipboard fixes resolve the reported mismatch. | Copied text equals the displayed formatted result; unsupported/denied clipboard access gets an actionable error. | [PR #452](https://github.com/iib0011/omni-tools/pull/452), [PR #430](https://github.com/iib0011/omni-tools/pull/430). |

## Ordered feature plan

Owner-requested Web/HTML conversion has a separate phased
[research and implementation plan](WEB_CONVERSION_PLAN.md). HTML to Image is implemented on
feature/html-to-image for review: static text/table/list HTML, safe inline styles,
PNG/JPEG, bounded dimensions/scale, transparency, upload/preview/download and
cancellation. Embedded PNG/JPEG data URLs have header checks, byte/pixel budgets
and native decode validation; external images, SVG/APNG, scripts and stylesheet
blocks remain blocked. Safe system font stacks, overflow/split-row warnings and
optional strict crop rejection are implemented. Output is one fixed-size image;
bounded multi-page raster pagination is implemented on the branch, not merged.
Ranges are implemented on the branch; repeated table headers are implemented on the branch; URL conversion remains deferred. jsPDF is upgraded to 4.2.1 on the branch with real PDF regression coverage;
61 inherited audit findings remain. One-page HTML to PDF is implemented on the branch with A4/Letter, orientation,
margins, aspect-preserving fit, strict crop handling and a raster-text label.
Page ranges are implemented on the branch; repeated table headers are implemented on the branch; URL conversion remains deferred. This
request does not imply acceptance by upstream or completion of PDF privacy work.

Difficulty is relative implementation risk, not an estimate of calendar time.
All items below remain planned until their implementation PR is merged and verified.

| Order | Feature and issue source | MVP and acceptance criteria | Difficulty / sync considerations |
| --- | --- | --- | --- |
| 1 | **Text Workflow Builder** - [#341](https://github.com/iib0011/omni-tools/issues/341), [#199](https://github.com/iib0011/omni-tools/issues/199) | Text-only pipeline: trim, uppercase, reverse, remove duplicate lines, Base64 and URL encoding. Add/reorder/remove steps, inspect intermediate outputs, import/export validated recipes without input text. Unicode and failed-step tests; bounds on input, steps and output. No automatic persistence. | Medium. Separate pipeline module with adapters to existing pure services. Upstream direction is unsettled; this is an Orvulix MVP, not an agreed upstream design. Review [PR #392](https://github.com/iib0011/omni-tools/pull/392). |
| 2 | **Docker Run to Compose** - [#379](https://github.com/iib0011/omni-tools/issues/379) | Parse common `docker run` ports, volumes, environment, network, name and restart options into downloadable Compose YAML. Never execute shell input. Preserve quoted values, reject malformed input, warn on unsupported options rather than silently dropping them. | Medium. Isolated parser and UI; evaluate parser/library maintenance and licensing first. |
| 3 | **File Checksum Calculator** - [#114](https://github.com/iib0011/omni-tools/issues/114) | SHA-256 and SHA-512 for local files, expected-checksum comparison and copy. Known-vector tests and case-insensitive hex comparison. Set a memory-conscious size cap before loading files; no uploads. MD5 and encryption are outside MVP. | Low-medium. Prefer Web Crypto without new dependencies; isolate worker if needed. Upstream maintainer previously prioritized media tools, so do not imply this was accepted there. |
| 4 | **Data Transfer Time Calculator** - [#80](https://github.com/iib0011/omni-tools/issues/80) | Size plus transfer rate yields estimated duration. Explicit bits/bytes and decimal/binary units, optional efficiency percentage, handling for zero/negative/non-finite inputs. Verify unit conversions with examples. | Low. Reuse generic-calculator conventions where practical; avoid changing shared calculator behavior. |
| 5 | **Subnet Calculator** - [#231](https://github.com/iib0011/omni-tools/issues/231) | IPv4 CIDR/mask, network, broadcast and host range. Test /0, /31 and /32 with documented semantics. IPv6 is a later phase, not a promised MVP capability. | Medium. Pure standalone arithmetic/parser; no DNS or remote API. |
| 6 | **Lossless PNG Optimizer** - [#359](https://github.com/iib0011/omni-tools/issues/359), [#295](https://github.com/iib0011/omni-tools/issues/295) | Benchmark a local encoder/WASM first. Preserve dimensions and decoded pixels, define metadata handling, compare sizes and retain the original when output grows. Do not label palette quantization as lossless. Limits, cancellation and pixel-equality fixtures required. | Medium-high. Prefer an isolated optimizer rather than rewriting existing compression. Review [PR #461](https://github.com/iib0011/omni-tools/pull/461); preserving dimensions alone does not prove losslessness. |
| 7 | **Batch OCR** - [#349](https://github.com/iib0011/omni-tools/issues/349) | Multiple images with language selection before processing, Vietnamese support if the model is available, progress/cancel and ordered TXT/ZIP output. PDF output and automatic language detection deferred. Verify cancellation and cleanup after errors. | Medium. Reuse Tesseract/JSZip already installed. Lazy model downloads and disclose network use. Keep a separate batch module with minimal OCR integration. |
| 8 | **Images to GIF improvements** - [#433](https://github.com/iib0011/omni-tools/issues/433) | Drag-and-drop with bounded file count, flexible FPS/frame delay, explicit Create and visible progress. Test frame order, timing and invalid files. Quality/file-size optimization is a separate investigation. | Medium. Existing GIF tool is an upstream hotspot. Review [PR #458](https://github.com/iib0011/omni-tools/pull/458) before duplicating its work. |
| 9 | **Audio/Video Trim Timeline** - [#268](https://github.com/iib0011/omni-tools/issues/268) | Keyboard-accessible start/end sliders synced to time inputs, selected-range preview and valid-range checks. Test duration boundaries and export accuracy; waveform generation is outside MVP. | Medium. Reusable timeline component with small adapters; review [PR #293](https://github.com/iib0011/omni-tools/pull/293). |
| 10 | **Local PDF Form Builder** - [#106](https://github.com/iib0011/omni-tools/issues/106), [#244](https://github.com/iib0011/omni-tools/issues/244) | Add named text fields and checkboxes, position them on pages and export an AcroForm PDF. Verify round-trip fields/values, rotated-page coordinates and compatibility with selected PDF readers. No digital signatures or cloud saving. | High. Evaluate existing pdf-lib capability; do not implement through an undisclosed external embed. Review [PR #247](https://github.com/iib0011/omni-tools/pull/247). |
| 11 | **OCR Table to CSV** - [#234](https://github.com/iib0011/omni-tools/issues/234) | Single-image table extraction with editable rows/columns before CSV download. Handle CSV quoting and warn about spreadsheet formula injection. Never claim perfect extraction. PDF batches and XLSX deferred. | High. Depends on OCR evaluation; use a standalone correction UI and test real table fixtures. |
| 12 | **Local MCP Companion** - [#177](https://github.com/iib0011/omni-tools/issues/177) | Separate local stdio package exposing selected pure JSON/text tools. Validate inputs, bound outputs and test tool schemas/results using an MCP client. No public server, API key handling or arbitrary command execution in MVP. | High. Separate package boundary avoids restructuring the SPA. Evaluate [the community implementation](https://github.com/raman325/omni-tools-mcp) and its license. Model access/cost belongs to the user's client; this does not demonstrate a live Claude API integration or guarantee program eligibility. |

## Suggested delivery sequence

1. Verify and address the foundation findings, each in a small separate PR.
2. Build Text Workflow Builder as the first differentiating local feature.
3. Deliver Docker Run to Compose and File Checksum independently.
4. Add transfer-time and subnet calculators, then evaluate PNG/OCR feasibility.
5. Schedule GIF/timeline/PDF features after reviewing upstream PRs and available capacity.
6. Explore table OCR and the MCP companion after the local functions are stable.

Before starting an item, record its chosen scope, dependency/license decision,
upstream status and acceptance tests in the implementation PR. Update this backlog
only when actual delivery status changes. Do not equate an open upstream PR with
an accepted or tested feature.

## Do not duplicate or prioritize yet

- HEIC conversion ([#201](https://github.com/iib0011/omni-tools/issues/201)) is
  partially implemented; inspect supported directions/formats before proposing more.
- Text/JSON comparison ([#90](https://github.com/iib0011/omni-tools/issues/90)) and
  audience filtering ([#174](https://github.com/iib0011/omni-tools/issues/174))
  already have code. Reproduce remaining gaps rather than replacing them wholesale.
- Pages subpath support overlaps [#198](https://github.com/iib0011/omni-tools/issues/198)
  and [#388](https://github.com/iib0011/omni-tools/issues/388); Orvulix already has
  Pages build-time base-path support. Docker runtime routing is a different task.
- PDF-to-Word ([#69](https://github.com/iib0011/omni-tools/issues/69)), EPUB-to-PDF
  ([#462](https://github.com/iib0011/omni-tools/issues/462)) and PDF/A
  ([#183](https://github.com/iib0011/omni-tools/issues/183)) need fidelity/compliance
  research. Review existing PRs before promising browser-only conversion.
- PDF translation, cloud saving, public MCP hosting and user accounts introduce
  cost or backend scope. Defer them under the current local-first budget.
- OCR/background-removal asset self-hosting ([#464](https://github.com/iib0011/omni-tools/issues/464))
  can consume hosting bandwidth/credits. Evaluate asset sizes and licensing before
  calling this a cost-saving or fully offline solution.


HTML/PDF pagination update (PR20, implemented on feature/html-to-image, not merged):
explicit One page/Paginated modes; width-fit, atomic leaf/row boundaries, default
oversized-content rejection, sequential page captures, 8-page/10000-CSS-px/
4-MP-page/16-MP-total/8-MiB budgets. Partial last pages retain scale. Preview/export
share the planner; export remeasures its input snapshot. Optional source page ranges are implemented; repeated thead headers are implemented; no split option, custom fonts or URL converters. See WEB_CONVERSION_PLAN.md.


PR20 page ranges: implemented on feature/html-to-image, not merged. All pages or
bounded 1-based custom syntax (128 UTF-8 bytes/16 tokens); normalize duplicates and
ordering, reject invalid/out-of-source input. Full-plan budgets remain enforced,
only selected pages are captured, original geometry stays intact and UI progress
separates source number from output position. Fix the baseline assembler's false
rejection of safe pre-broken plans. Custom fonts/URLs remain deferred; see WEB_CONVERSION_DEFERRED.md for reopening gates.


PR20 repeated table headers: implemented on feature/html-to-image, not merged.
Paginated-only option defaults Off. Measured thead clones lock original column
widths and reserve continuation height before ranges; repeated pixels count
against unchanged limits. Multi-row headers and header colspan are supported;
rowspan/nesting/body colspan/caption/tfoot/flex tables reject with option On.
Normal collapsed-border half-pixel row seams now progress instead of incorrectly
retreating through the entire table. Real PDF/browser coverage and details are
in WEB_CONVERSION_PLAN.md; custom fonts/URL conversion remain deferred.


PR20 local completion: local conversion MVP and six validated option presets are
implemented on feature/html-to-image, not merged. Presets preserve HTML/filename,
clear/cancel stale work and persist no content/settings. Full Web conversion is
not complete. See [deferred work and reopening gates](WEB_CONVERSION_DEFERRED.md)
for uploaded fonts, remote platform, URL outputs, automation and authenticated /
batch jobs. These are not features shipped by the local MVP.

PR20 review corrections: capture/asset elapsed deadlines now reject completion
past the budget before timer delivery, with late-resource cleanup and recovery
regressions. The headers UI unit flow is split into independent lifecycle cases;
FAQ describes the existing separate raster-PDF tool. Implemented on branch, not
merged; full Web conversion and the deferred register remain unchanged.
