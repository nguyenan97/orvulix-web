# Orvulix Product Roadmap

**Simple tools. Smarter workflows. Better productivity.**

**Status:** Public roadmap. Planned and exploratory features are not available yet. Updated: October 2026.

Orvulix is an open-source workspace for useful browser-based tools. We want to help developers, students, creators, and everyday users work with data, documents, images, and text without unnecessary setup.

Our approach is to make existing tools better first, then explore new capabilities that solve meaningful problems. This roadmap describes priorities, not fixed delivery dates.

## 1. Better everyday tools

**Current focus - Usability, performance, and reliability**

- Improve loading speed and responsiveness across desktop and mobile.
- Make tools easier to find through clearer categories, navigation, and search.
- Add practical examples, instructions, and actionable error messages.
- Strengthen accessibility, automated testing, and reliability.
  This branch isolates regex splitting in all 11 list tools with
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
are planned, not shipped. Each implementation uses a feature branch from `develop`
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
before merge; header repetition is merged into develop via PR20. Custom fonts remain deferred.


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
reliability fixes on the feature branch, not a change to remote conversion scope.

## URL-first Web conversion discovery update

PR20 local HTML conversion and PR21 security remediation are merged into develop,
not evidence of a production release or URL conversion availability. The current
feature/web-conversion-ux branch corrects experimental local-tool discovery/copy
for review. Local HTML tools retain upload/paste/sample/export but are not homepage
category CTA examples and appear after other browse/related tools. Search remains
available and unchanged.

Next milestones: renderer architecture/security/measured cost decision -> actual
URL to PDF MVP -> URL to Image/advanced options. These remain deferred; no backend
or fake URL input exists. See WEB_CONVERSION_PLAN.md for gates and sync hotspots.

## Selective upstream integration

Follow UPSTREAM_SYNC.md: compare upstream/main against Orvulix develop and port
one bounded improvement at a time, preserving branding/SEO/Pages/security rules.
Current feature/upstream-png-dimensions ports PNG dimension correctness (#461),
not a complete encoder/batch migration or lossless optimizer. Further GIF/drop
and generic image compression work require separate acceptance/tests. Owner has
paused Web/URL conversion; retain existing local HTML tools without extending them.

### Shared file-input reliability

Multi-file drop adaptation on feature/upstream-multifile-drop covers image/audio/
video/PDF inputs, including queued budgets, invalid batch recovery and owned URL
cleanup. It preserves existing tool conversion behavior and does not extend Web/
URL conversion. Implementation is on the feature branch until its PR is merged;
consumer conversion cancellation requires a separate reliability task.

### GIF output ownership

The feature/gif-conversion-lifecycle branch addresses output reappearing after
Clear during conversion, without changing existing auto-generation or GIF timing.
Resolve merge status in PR #26; see GIF_CONVERSION_LIFECYCLE.md. This does not
complete GIF quality/timing work, mixed-format fidelity or other converters.

### Mixed-format GIF reliability

feature/gif-mixed-format-fidelity fixes missing JPEG/PNG content in mixed concat
jobs using bounded sequential normalization, with PR26 lifecycle retained.
Implementation is on the feature branch until verified PR merge. Different-size
padding/resizing, other formats and quality/timing remain separate work; see
GIF_MIXED_FORMAT.md.
