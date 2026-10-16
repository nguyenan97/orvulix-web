# Orvulix Product Roadmap

**Simple tools. Smarter workflows. Better productivity.**

**Status:** Public roadmap with separate development delivery and planned scope.
Reconciled October 15, 2026. Develop changes are not a production release.

Orvulix is an open-source workspace for useful browser-based tools. We want to help developers, students, creators, and everyday users work with data, documents, images, and text without unnecessary setup.

Our approach is to make existing tools better first, then explore new capabilities that solve meaningful problems. This roadmap describes priorities, not fixed delivery dates.

## Verified development delivery

Reconciled 2026-10-16 against develop `2c91155` and main `96494b8`. PR19/20/22
and PR24-34 are merged into develop, not released to main. These cover bounded
list regex, local HTML conversion/discovery, PNG dimensions, multi-file input,
GIF reliability, engineering practices, Merge PDF ownership and text/code-result clipboard reliability. The authoritative
[delivery snapshot](FEATURE_BACKLOG.md#verified-delivery-snapshot) records PRs,
merge commits and remaining scope. PR33 PDF Editor opt-in and its bounded audit are tracked below.

## 1. Better everyday tools

**Current focus - Usability, performance, and reliability**

- Improve loading speed and responsiveness across desktop and mobile.
- Make tools easier to find through clearer categories, navigation, and search.
- Add practical examples, instructions, and actionable error messages.
- Strengthen accessibility, automated testing, and reliability.
  PR19 merged regex splitting in all 11 list tools with
  [bounded workers](BOUNDED_LIST_REGEX.md), with numeric guards for Group and Duplicate
  and preflight checks for Group padding separator expansion.
- Improve search visibility with helpful, original content for individual tools.
- Web/HTML conversion follows a [separate phased plan](WEB_CONVERSION_PLAN.md).
  PR20 is merged into develop: experimental local HTML to PNG/JPEG/raster PDF,
  safe static input, bounded embedded images, system fonts, crop warnings,
  pagination, ranges, supported repeated table headers and presets. PDF text is
  not searchable/selectable. Custom fonts, complex layouts and URL rendering
  remain deferred. PR21 security remediation is merged; production approval and
  remote renderer isolation/operation require separate decisions.

**Outcome we want:** People can find the right tool quickly, complete their task, and confidently return when they need it again.

## 2. Practical AI assistance

**Local demos implemented - Live Claude integration planned**

The `/json-assistant` route implements a local prototype with authored explanations for three fixtures and deterministic schema inference/validation for custom JSON. This is not a live AI feature: no provider request, API key, SDK or paid inference is used. See [demo architecture and limits](JSON_ASSISTANT.md). A future Claude-powered assistant could explain unfamiliar payloads and suggest transformations; outputs would need review and validation.

A second local prototype, [Regex Assistant](REGEX_ASSISTANT.md), is implemented at `/regex-assistant`. It combines authored examples with real JavaScript regex testing in a disposable timed worker. A Claude-powered regex generator remains planned; the local demo does not generate AI suggestions.

Other ideas to evaluate after learning from the prototypes:

- **Smart Data Conversion:** propose editable mappings between JSON, CSV, YAML, and XML.
- **Regex Assistance:** explain expressions, suggest patterns, and generate test cases.
- **Document Assistance:** help summarize user-selected content and draft structured extraction results.
- **Text Assistance:** help rewrite, translate, summarize, and organize selected text.
- **Tool Discovery:** suggest the most relevant existing tool from a user's task description.

AI will be optional. Existing non-AI tools should remain usable without it. These features are proposals, not currently available.

**Outcome we want:** Reduce the effort of understanding and preparing complex inputs while keeping users in control of the results.

## 3. Connected workflows

**Exploring - Fewer repetitive steps**

Many tasks involve several tools. We want to explore simple ways to pass results between compatible utilities without repeated copying and pasting.

Possible workflows include:

- Inspect JSON, validate its structure, convert it to CSV, and download the output.
- Prepare an image, adjust its dimensions, and export it in a suitable format.
- Extract selected document content, review the result, and transform it into a useful format.

We will prioritize previewable changes, clear confirmation, and workflows that can be maintained reliably.

**Outcome we want:** Help people complete a full task, not just one isolated operation.

## 4. Open and sustainable growth

**Ongoing - Community, privacy, and maintainability**

- Keep core utilities free and accessible.
- Welcome contributions, bug reports, documentation improvements, and suggestions.
- Preserve attribution to the open-source projects and contributors we build upon.
- Improve privacy disclosures and explain when external services may process inputs.
- Explore multilingual support and accessibility improvements.
- Use feedback and demonstrated needs to decide what to build next.

**Outcome we want:** A useful platform that can grow sustainably without compromising trust.

## Issue-backed implementation backlog

See [the prioritized upstream issue backlog](FEATURE_BACKLOG.md) for MVP scope,
acceptance criteria and upstream PRs to review before implementation. These items
are planned or partial; verified development subscopes are listed above. Each implementation uses a feature branch from `develop`
and a PR into `develop`; production releases require separate authorization.

## How we prioritize

1. **Strengthen the foundation:** improve existing tools and fix issues that affect everyday use.
2. **Validate one idea:** build a small prototype with clear success criteria.
3. **Learn from real use:** assess correctness, usability, feedback, and operating costs.
4. **Expand thoughtfully:** release broader functionality only when it provides measurable value and can be maintained.

We do not publish speculative release dates. Priorities may change as we learn from users and technical constraints.

## First AI prototype - Technical considerations

The local demo is implemented in development; publication follows the normal feature-to-develop and authorized develop-to-main workflow. A live Claude integration remains planned. Before connecting a provider, we intend to:

- Require explicit user action before sending data to an AI provider.
- Keep API credentials on the server, never in browser code.
- Set request-size limits, rate limits, timeouts, and spending safeguards.
- Clearly disclose what data is sent to external services.
- Validate machine-readable outputs and let users review proposed changes.
- Test accuracy, error handling, latency, and costs before considering wider availability.

## Help shape Orvulix

We welcome practical suggestions and contributions.

- **Website:** https://orvulix.io.vn/
- **Source and contributions:** https://github.com/nguyenan97/orvulix-web
- **Contact:** founder@orvulix.io.vn

Orvulix is independently maintained as a fork of [OmniTools](https://github.com/iib0011/omni-tools), with original attribution and licensing preserved.


PR20 pagination gate: merged into develop via PR20. Explicit
Paginated width-fit uses bounded sequential captures and protected block/row
boundaries, rejecting oversized/unsafe layout. One page remains default. Review
actual PDF bytes, cross-browser page seams, deadlines/cleanup and Pages smoke
for the merged implementation; header repetition is merged into develop via PR20. Custom fonts remain deferred.


Page ranges (PR20): merged into develop via PR20. Explicit
All pages/Custom ranges select original source pages without reflow or bypassing
full-document limits. Invalid input is rejected, normalized selection is visible,
selected capture is cancellable and PDF source/output order is tested with actual
bytes/pixels. Repeated table headers are merged into develop via PR20. Custom fonts/URL rendering remain deferred.


Local Web/HTML conversion MVP (PR20) is merged and verified on develop via PR20, including six option presets without content/settings storage.
The full Web conversion feature remains incomplete. See the
[deferred register](WEB_CONVERSION_DEFERRED.md) for font/security gates, remote
service prerequisites and future URL outputs/automation. No backend or paid API
is added by the local delivery.

PR20 local reliability review: monotonic capture/asset acceptance deadlines and
late-result cleanup regressions are implemented on the develop via merged PR20.
The separate HTML to PDF tool is described as implemented raster output, while
fonts, URL rendering and automation remain deferred. Release still follows the
normal develop review and separately authorized main workflow.

PR20 pagination fidelity corrections retain painted border-only boxes and reject
left-of-viewport content instead of silently cropping it. These are local MVP
reliability fixes merged into develop in PR20, not a change to remote conversion scope.

## URL-first Web conversion discovery update

PR20 local HTML conversion and PR21 security remediation are merged into develop,
not evidence of a production release or URL conversion availability. PR22 merged
the experimental local-tool discovery/copy correction into develop. Local HTML tools retain upload/paste/sample/export but are not homepage
category CTA examples and appear after other browse/related tools. Search remains
available and unchanged.

Next milestones: renderer architecture/security/measured cost decision -> actual
URL to PDF MVP -> URL to Image/advanced options. These remain deferred; no backend
or fake URL input exists. See WEB_CONVERSION_PLAN.md for gates and sync hotspots.

## Selective upstream integration

Follow UPSTREAM_SYNC.md: compare upstream/main against Orvulix develop and port
one bounded improvement at a time, preserving branding/SEO/Pages/security rules.
PR24 merged PNG dimension correctness (#461) into develop,
not a complete encoder/batch migration or lossless optimizer. PR25/26/27 merged bounded drop and GIF reliability work; remaining GIF UX/quality
and generic image compression need separate acceptance/tests. Owner has
paused Web/URL conversion; retain existing local HTML tools without extending them.

### Shared file-input reliability

Multi-file drop adaptation merged into develop in PR25 covers image/audio/
video/PDF inputs, including queued budgets, invalid batch recovery and owned URL
cleanup. It preserves existing tool conversion behavior and does not extend Web/
URL conversion. PR25 is verified merged;
consumer conversion cancellation requires a separate reliability task.

### GIF output ownership

PR26 merged into develop and addresses output reappearing after
Clear during conversion, without changing existing auto-generation or GIF timing.
Merge verified at 4a8489c; see GIF_CONVERSION_LIFECYCLE.md. This does not
complete GIF quality/timing work, mixed-format fidelity or other converters.

### Mixed-format GIF reliability

PR27 merged into develop and fixes missing JPEG/PNG content in mixed concat
jobs using bounded sequential normalization, with PR26 lifecycle retained.
Merge verified at 6fab3c3. Different-size
padding/resizing, other formats and quality/timing remain separate work; see
GIF_MIXED_FORMAT.md.

## Merge PDF output ownership

Merged into develop through [PR #29](https://github.com/nguyenan97/orvulix-web/pull/29). A reproduced Clear
during merge could republish an old PDF. The bounded owner now invalidates on
selection edits/Clear/unmount, ignores late completion/error and exposes current
failures with recovery. File/page order, geometry and automatic merge remain.
See [scope, budgets and validation](PDF_MERGE_LIFECYCLE.md). This does not extend
Split PDF or other conversion consumers; release to main is separate.

## Shared text-result copy reliability

PR30 merged a change that aligns copied text with the displayed ToolTextResult value and
adds manual-copy guidance when native clipboard access fails. Downloads retain
the original data. PR30 is merged into develop; this is not a production
release or completion of JSON prettify/other clipboard investigations. Public
/roadmap separates verified development delivery through PR32 from planned features;
see FEATURE_BACKLOG.md for the current partial foundation scope.

### Code-result follow-up

PR31 merged the same native clipboard failure guidance into code results
without transforming formatted code. Secure-origin JSON copy and insecure-origin
manual-copy guidance are validated separately. PR31 is merged into develop, not main; historical issue390 and input/file consumer investigation are not marked
fully resolved. No production release, HTTP fallback or formatter rewrite.


### Shared input footer follow-up

PR32 merged guarded native copy into text/code input footers,
retaining exact source text, editing and file import. This is merged into develop,
not released to main. Actual-origin/code-editor tests and delivery are tracked in
tasks/input-clipboard.md. Other clipboard consumers and editor-wide HTTP gestures
remain follow-ups; there is no deprecated fallback or wider issue390 claim.


## PDF Editor external-service consent

PR33 (`663b0dc`) merged into develop and requires enabling SimplePDF before loading its external editor
and discloses observed analytics/document metadata. Closing removes the embed;
consent is not persisted. This is a bounded privacy correction, not a new local
PDF editor or full provider audit. See PDF_EDITOR_PRIVACY.md for measured scope,
limits and save/share follow-ups; delivery is development-only; production release is separate.


## Shared text/code file-import ownership

Implementation on `feature/text-file-import-ownership` (PR #34): a shared native
FileReader owner cancels old reads on edits, replacement files, external value
changes and unmount. Queued callbacks cannot overwrite newer content. Read errors
get retry guidance and the picker permits reselecting the same file. Existing
readAsText decoding and empty files are retained. See
[tasks/text-file-import-ownership.md](tasks/text-file-import-ownership.md).
Merge status is authoritative in PR #34; this is not a production release.
Whole-file allocation/decoding limits, JSON Prettify stale-result behavior on empty
source, other file input components and pending
clipboard notification ownership remain separate follow-ups.


## JSON Prettify result ownership

Implementation on `feature/json-prettify-result-ownership`, not yet merged:
empty/invalid source has no stale output and cannot be copied/downloaded. Inline
validation reflects current input and disappears on recovery. Output derives
synchronously from the current source/Formik options using the existing formatter.
This does not migrate shared ToolContent, other tools, parser precision or resource
limits. See [task checkpoint](tasks/json-prettify-result-ownership.md). PR34 file
import ownership is merged into develop; this result-ownership correction is
separate and not released to production.
