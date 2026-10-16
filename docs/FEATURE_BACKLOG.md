# Orvulix issue-backed feature backlog

Status: planned/partial milestones plus verified development delivery below.
Delivery reconciled October 16, 2026; upstream issue research dated October 11.

Source: [OmniTools open issues](https://github.com/iib0011/omni-tools/issues).
The review covered 57 open issues, current open PRs, and Orvulix `develop`.
Issue/PR states are a dated snapshot, not proof that a fix is complete or suitable.
Recheck upstream before starting each item. Priorities are relative; no delivery
dates, adoption metrics or Claude program approval are promised.

The `/roadmap` page shows user-facing summaries, proposed priority and Planned
status. Copy lives in `src/seo/roadmap.ts`, shared by React and static prerender;
update it alongside this ordered plan. Technical criteria stay in this document.

## Verified delivery snapshot

Reconciled 2026-10-16 against develop `2c91155` and main `96494b8`.
Every PR below is merged and its merge commit is reachable from develop, not main.
Production release remains separate. Issue research below retains its original
October 11 snapshot; this delivery reconciliation is not a fresh review of all
upstream issues. PR30-32 clipboard delivery and PR33 PDF consent are described below.

| Scope | Verified delivery | Still outside that delivery |
| --- | --- | --- |
| Bounded list regex execution | Develop PR #19, `31fb8ac` | Other regex consumers require their own review. |
| Local HTML image/raster PDF and discovery | Develop PR #20/#22, `96d23b4`/`a32c133` | URL conversion paused; custom fonts/remote rendering deferred. |
| PNG dimensions/non-inflation | Develop PR #24, `097d594` | Lossless pixel preservation/new encoder not delivered. |
| Multi-file picker/drop | Develop PR #25, `d96ab5b` | Consumer conversion ownership is separate. |
| GIF lifecycle/mixed PNG-JPEG fidelity | Develop PR #26/#27, `4a8489c`/`6fab3c3` | Explicit Create, richer progress, further timing UX and quality work remain. |
| Engineering practices | Develop PR #28, `fd1214d` | Instructions do not guarantee agent compliance or grant additional authority. |
| Text-result clipboard | Develop PR #30, `ef29d62` | Other clipboard consumers/old Umbrel reports need their own verification. |
| Code-result clipboard | Develop PR #31, `17c549d` | Input/file consumers and editor-wide HTTP gestures require separate work. |
| Input clipboard | Develop PR #32, `534f2a6` | File/diff consumers and editor-wide handlers are separate. |
| Shared text/code file import | Develop PR #34, `2c91155` | Whole-file budgets, other file inputs and native clipboard intermittency remain separate. |
| PDF Editor opt-in | Develop PR #33, `663b0dc` | Live audit covers load/render only; save/share/retention remain follow-ups. |
| Merge PDF lifecycle | Develop PR #29, `e4233a0` | Cancellation is cooperative; other PDF consumers/worker isolation are separate. |

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
| Timed regex execution in inherited list tools | [#377](https://github.com/iib0011/omni-tools/issues/377). Merged into develop in PR #19: bounded regex execution for all 11 list tools with regex splitting, including Group at /list/chunk. Typed adapters retain existing transformations; Group and Duplicate also guard dangerous numeric options in both modes; regex preflight includes separators added by Group padding. See [architecture, limits and sync hotspots](BOUNDED_LIST_REGEX.md). | Catastrophic backtracking cannot freeze the UI; invalid syntax, cancellation, timeout and subsequent recovery work. Length limits alone are insufficient. | [PR #383](https://github.com/iib0011/omni-tools/pull/383), [PR #389](https://github.com/iib0011/omni-tools/pull/389), [PR #366](https://github.com/iib0011/omni-tools/pull/366). |
| PDF Editor privacy audit | [#301](https://github.com/iib0011/omni-tools/issues/301). Verify SimplePDF requests with a local fixture; distinguish asset downloads, analytics, fingerprints and document uploads. Existing privacy copy is not a network audit. | Document observed behavior. If integration sends data, disclose exact categories and require opt-in before loading it. Do not claim local-only without verification. | Recheck SDK behavior/version and upstream discussion before changing it. |
| Clipboard regression triage (partial) | [#390](https://github.com/iib0011/omni-tools/issues/390). PR30 merged shared ToolTextResult display/copy alignment and API failure guidance. PR31 guards ToolCodeResult without changing formatted values; secure-copy and real insecure-origin policy are tested. This does not establish the root cause of every historical Umbrel report. Input/file clipboard consumers remain follow-ups. | Copied text equals the displayed formatted result; unsupported/denied clipboard access gets an actionable error. | [PR #452](https://github.com/iib0011/omni-tools/pull/452), [PR #430](https://github.com/iib0011/omni-tools/pull/430). |

## Ordered feature plan

Owner-requested Web/HTML conversion has a separate phased
[research and implementation plan](WEB_CONVERSION_PLAN.md). PR20 is merged into
develop: local HTML to PNG/JPEG and raster PDF, safe static HTML/inline styles,
bounded embedded images, system fonts, explicit upload/preview/download,
cancellation, crop warnings, one-page/paginated PDF, ranges, repeated supported
table headers and presets. PDF text is not searchable/selectable; custom fonts,
URL conversion and complex layout support remain deferred. jsPDF 4.2.1 and real
output regression coverage are merged. PR21 dependency remediation is merged;
see SECURITY_REMEDIATION.md for findings/temporary exceptions. Develop delivery
is not a production release, upstream acceptance or complete Web conversion.

Difficulty is relative implementation risk, not an estimate of calendar time.
The milestones below remain planned or partial. Merged subscopes do not complete
the whole milestone; use the verified delivery snapshot above.

| Order | Feature and issue source | MVP and acceptance criteria | Difficulty / sync considerations |
| --- | --- | --- | --- |
| 1 | **Text Workflow Builder** - [#341](https://github.com/iib0011/omni-tools/issues/341), [#199](https://github.com/iib0011/omni-tools/issues/199) | Text-only pipeline: trim, uppercase, reverse, remove duplicate lines, Base64 and URL encoding. Add/reorder/remove steps, inspect intermediate outputs, import/export validated recipes without input text. Unicode and failed-step tests; bounds on input, steps and output. No automatic persistence. | Medium. Separate pipeline module with adapters to existing pure services. Upstream direction is unsettled; this is an Orvulix MVP, not an agreed upstream design. Review [PR #392](https://github.com/iib0011/omni-tools/pull/392). |
| 2 | **Docker Run to Compose** - [#379](https://github.com/iib0011/omni-tools/issues/379) | Parse common `docker run` ports, volumes, environment, network, name and restart options into downloadable Compose YAML. Never execute shell input. Preserve quoted values, reject malformed input, warn on unsupported options rather than silently dropping them. | Medium. Isolated parser and UI; evaluate parser/library maintenance and licensing first. |
| 3 | **File Checksum Calculator** - [#114](https://github.com/iib0011/omni-tools/issues/114) | SHA-256 and SHA-512 for local files, expected-checksum comparison and copy. Known-vector tests and case-insensitive hex comparison. Set a memory-conscious size cap before loading files; no uploads. MD5 and encryption are outside MVP. | Low-medium. Prefer Web Crypto without new dependencies; isolate worker if needed. Upstream maintainer previously prioritized media tools, so do not imply this was accepted there. |
| 4 | **Data Transfer Time Calculator** - [#80](https://github.com/iib0011/omni-tools/issues/80) | Size plus transfer rate yields estimated duration. Explicit bits/bytes and decimal/binary units, optional efficiency percentage, handling for zero/negative/non-finite inputs. Verify unit conversions with examples. | Low. Reuse generic-calculator conventions where practical; avoid changing shared calculator behavior. |
| 5 | **Subnet Calculator** - [#231](https://github.com/iib0011/omni-tools/issues/231) | IPv4 CIDR/mask, network, broadcast and host range. Test /0, /31 and /32 with documented semantics. IPv6 is a later phase, not a promised MVP capability. | Medium. Pure standalone arithmetic/parser; no DNS or remote API. |
| 6 | **Lossless PNG Optimizer** - [#359](https://github.com/iib0011/omni-tools/issues/359), [#295](https://github.com/iib0011/omni-tools/issues/295) | Benchmark a local encoder/WASM first. Preserve dimensions and decoded pixels, define metadata handling, compare sizes and retain the original when output grows. Do not label palette quantization as lossless. Limits, cancellation and pixel-equality fixtures required. | Medium-high. Prefer an isolated optimizer rather than rewriting existing compression. Review [PR #461](https://github.com/iib0011/omni-tools/pull/461); preserving dimensions alone does not prove losslessness. |
| 7 | **Batch OCR** - [#349](https://github.com/iib0011/omni-tools/issues/349) | Multiple images with language selection before processing, Vietnamese support if the model is available, progress/cancel and ordered TXT/ZIP output. PDF output and automatic language detection deferred. Verify cancellation and cleanup after errors. | Medium. Reuse Tesseract/JSZip already installed. Lazy model downloads and disclose network use. Keep a separate batch module with minimal OCR integration. |
| 8 | **Images to GIF improvements** - [#433](https://github.com/iib0011/omni-tools/issues/433) | Partial in develop: bounded multi-file import (PR25), stale-result ownership (PR26), mixed PNG/JPEG fidelity (PR27); existing FPS/delay options remain. Explicit Create, richer progress and further timing UX are not completed. Preserve frame-order/timing/invalid-input tests. Quality/file-size optimization is a separate investigation. | Medium. Existing GIF tool is an upstream hotspot. Review [PR #458](https://github.com/iib0011/omni-tools/pull/458) before duplicating its work. |
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


HTML/PDF pagination update (PR20, merged into develop via PR20):
explicit One page/Paginated modes; width-fit, atomic leaf/row boundaries, default
oversized-content rejection, sequential page captures, 8-page/10000-CSS-px/
4-MP-page/16-MP-total/8-MiB budgets. Partial last pages retain scale. Preview/export
share the planner; export remeasures its input snapshot. Optional source page ranges are implemented; repeated thead headers are implemented; no split option, custom fonts or URL converters. See WEB_CONVERSION_PLAN.md.


PR20 page ranges: merged into develop via PR20. All pages or
bounded 1-based custom syntax (128 UTF-8 bytes/16 tokens); normalize duplicates and
ordering, reject invalid/out-of-source input. Full-plan budgets remain enforced,
only selected pages are captured, original geometry stays intact and UI progress
separates source number from output position. Fix the baseline assembler's false
rejection of safe pre-broken plans. Custom fonts/URLs remain deferred; see WEB_CONVERSION_DEFERRED.md for reopening gates.


PR20 repeated table headers: merged into develop via PR20.
Paginated-only option defaults Off. Measured thead clones lock original column
widths and reserve continuation height before ranges; repeated pixels count
against unchanged limits. Multi-row headers and header colspan are supported;
rowspan/nesting/body colspan/caption/tfoot/flex tables reject with option On.
Normal collapsed-border half-pixel row seams now progress instead of incorrectly
retreating through the entire table. Real PDF/browser coverage and details are
in WEB_CONVERSION_PLAN.md; custom fonts/URL conversion remain deferred.


PR20 local completion: local conversion MVP and six validated option presets are
merged into develop via PR20. Presets preserve HTML/filename,
clear/cancel stale work and persist no content/settings. Full Web conversion is
not complete. See [deferred work and reopening gates](WEB_CONVERSION_DEFERRED.md)
for uploaded fonts, remote platform, URL outputs, automation and authenticated /
batch jobs. These are not features shipped by the local MVP.

PR20 review corrections: capture/asset elapsed deadlines now reject completion
past the budget before timer delivery, with late-resource cleanup and recovery
regressions. The headers UI unit flow is split into independent lifecycle cases;
FAQ describes the existing separate raster-PDF tool. Merged into develop via PR20; full Web conversion and the deferred register remain unchanged.

PR20 second review: pagination retains trailing border-only boxes and rejects
negative horizontal flex overflow. Unit regressions and actual PDF pixel/browser
flows cover these cases. Merged into develop via PR20; limits and deferred
scope are unchanged.

## URL-first Web conversion discovery update

PR20 local HTML conversion and PR21 security remediation are merged into develop,
not evidence of a production release or URL conversion availability. PR22 merged
the experimental local-tool discovery/copy correction into develop. Local HTML tools retain upload/paste/sample/export but are not homepage
category CTA examples and appear after other browse/related tools. Search remains
available and unchanged.

Next milestones: renderer architecture/security/measured cost decision -> actual
URL to PDF MVP -> URL to Image/advanced options. These remain deferred; no backend
or fake URL input exists. See WEB_CONVERSION_PLAN.md for gates and sync hotspots.

## Upstream PNG dimension correction

Upstream review against main cf41a30 found #461 merged after the shared 3bbca2f
baseline. Orvulix merged the native-dimension/non-inflation contract into develop in PR24,
using existing browser-image-compression rather
than copying the new encoder/batch UI. This is not the planned lossless optimizer:
palette colors/metadata may change. See UPSTREAM_SYNC.md for candidates, boundaries
and the static-PNG compression limits. GIF/multiple-input drop support (#458) is
merged upstream and its bounded picker/drop adaptation is merged in Orvulix PR25;
that does not complete GIF creation/timing/quality improvements.
Web/URL conversion is paused by owner decision, not canceled or rolled back.

### Multi-file drop implementation checkpoint

Upstream #458 was selectively adapted and merged into develop in PR25, after
PNG PR24. All four shared inputs use one bounded picker/drop import pipeline,
atomic rejection, serial ordering and preview cleanup. Duplicate files remain
allowed. No GIF timing/Create/quality or conversion-service lifecycle work is
included. See UPSTREAM_SYNC.md for budgets, supported formats, validation and
remaining boundaries. PR25 is verified merged; other consumer lifecycles remain
separate follow-ups.

## Images to GIF lifecycle

PR25 multi-file inputs and PR26 consumer GIF lifecycle are merged into develop: immediate invalidation,
latest-result ownership, debounce unmount cleanup and optional cooperative queue/
service cancellation. Encoding/timing/Create/quality remain unchanged. See
GIF_CONVERSION_LIFECYCLE.md for limits, baseline evidence and the separate mixed-
format normalization finding. Other conversion consumers remain follow-ups.

## GIF mixed PNG/JPEG fidelity

After PR26 lifecycle work, merged PR27 adds sequential
RGBA PNG normalization only when PNG and JPEG occur together, preserving the
existing homogeneous encoder/timing. Equal decoded dimensions and bounded static
PNG/JPEG are required; errors are actionable. PR27 is verified merged into develop. See GIF_MIXED_FORMAT.md for budgets, evidence and limits.

## Merge PDF output ownership

Merged into develop through [PR #29](https://github.com/nguyenan97/orvulix-web/pull/29). A reproduced Clear
during merge could republish an old PDF. The bounded owner now invalidates on
selection edits/Clear/unmount, ignores late completion/error and exposes current
failures with recovery. File/page order, geometry and automatic merge remain.
See [scope, budgets and validation](PDF_MERGE_LIFECYCLE.md). This does not extend
Split PDF or other conversion consumers; release to main is separate.

## Shared text-result clipboard

Merged into develop in PR30 (`ef29d62`), not released to main. Copy uses
the displayed text, including textarea newline normalization; keepSpecialCharacters
preserves literal escapes. Missing/denied/synchronously throwing Clipboard API
gives manual-copy guidance. Download bytes remain raw. This does not resolve the
separate JSON prettify issue390 or every clipboard consumer. No fallback, permission
probing, dependencies or production release. See tasks/text-result-clipboard-roadmap.md.

## Code-result clipboard policy

Merged into develop in PR31 (`17c549d`), not released to main. See
tasks/code-result-clipboard.md and PR31. ToolCodeResult reuses PR30 native clipboard guidance while preserving
formatted JSON/literal escapes and download bytes. Insecure HTTP cannot use the
native Clipboard API; show HTTPS/manual-copy guidance instead of an uncaught
error or deprecated fallback. Upstream issue390 remains open; PR452/430 are open
and unmerged. Browser observations here do not establish all historical Umbrel
root causes or promise automatic HTTP copying. An unsupported code-result footer
gesture guard also prevents Monaco's WebKit ancestor handler from throwing; other
editor/input gestures remain a separate follow-up. No input/file consumer migration.


## Shared input clipboard guidance

Merged into develop in PR32 (`534f2a6`), not released to main. ToolTextInput and
ToolCodeInput reuse the existing native writer without decoding or formatting
source values. Missing/insecure/denied/synchronously throwing API gives guidance;
code-input footer gestures share PR31's unsupported ancestor guard. Input edits
and file import remain intact. See tasks/input-clipboard.md for actual evidence.
File/diff-result consumers, editor-wide HTTP handlers and file-reader lifecycle
remain separate. No HTTP copying fallback or production release.


## PDF Editor consent and bounded privacy audit

Merged into develop in PR #33 (`663b0dc`): external SimplePDF editor is disabled until explicit opt-in;
closing removes the iframe and a new tool mount starts disabled. Disclosure and
SEO explain observed analytics and document-fingerprint metadata. Synthetic live
load audit and limits are recorded in [PDF_EDITOR_PRIVACY.md](PDF_EDITOR_PRIVACY.md).
This is not a complete audit of save/share, accounts, provider retention or future
remote code. Those are follow-ups, not local-only guarantees. Delivery is tracked
by tasks/pdf-editor-consent.md; this is not released to production.


## Shared text/code file-import ownership

Implementation on `feature/text-file-import-ownership` (PR #34): a shared native
FileReader owner cancels old reads on edits, replacement files, external value
changes and unmount. Queued callbacks cannot overwrite newer content. Read errors
get retry guidance and the picker permits reselecting the same file. Existing
readAsText decoding and empty files are retained. See
[tasks/text-file-import-ownership.md](tasks/text-file-import-ownership.md).
Merge status is authoritative in PR #34; this is not a production release.
Whole-file allocation/decoding limits, other file input components and pending
clipboard notification ownership remain separate follow-ups. JSON Prettify
result ownership was separately delivered in PR35.


## JSON Prettify result ownership

Merged into develop in PR #35 (`18634f7`):
empty/invalid source has no stale output and cannot be copied/downloaded. Inline
validation reflects current input and disappears on recovery. Output derives
synchronously from the current source/Formik options using the existing formatter.
This does not migrate shared ToolContent, other tools, parser precision or resource
limits. See [task checkpoint](tasks/json-prettify-result-ownership.md). PR34 file
import ownership is merged into develop; this result-ownership correction is
separate and not released to production.


## JSON Minify result ownership

Implementation on `feature/json-minify-result-ownership`: empty/invalid input
clears output and disables export, with current inline errors and valid recovery.
JSON/JSONL format, extensions and the existing service semantics are retained.
See [JSON_MINIFY.md](JSON_MINIFY.md) and
[task checkpoint](tasks/json-minify-result-ownership.md) for evidence and limits.
PR metadata records merge status; this is not a production release. Whole-input
resource limits and other tool/result/clipboard migrations remain separate.
Public roadmap now records verified PR35 delivery at develop `18634f7`, distinct
from this branch's implementation and the 12 planned feature milestones.
