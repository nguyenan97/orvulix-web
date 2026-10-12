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
  HTML to Image is implemented on feature/html-to-image for review, with local
  static text/table/list rendering, bounded embedded PNG/JPEG and PNG/JPEG export.
  External resources/scripts are blocked; fonts and full-page refinement remain
  planned. HTML/PDF and URL rendering
  are planned, with PDF dependency review and remote isolation gates.

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
