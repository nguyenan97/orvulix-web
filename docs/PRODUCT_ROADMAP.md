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
- Improve search visibility with helpful, original content for individual tools.

**Outcome we want:** People can find the right tool quickly, complete their task, and confidently return when they need it again.

## 2. Practical AI assistance

**Planned - One focused prototype before broader expansion**

Our first proposed AI feature is an **AI JSON Assistant**. It would help users understand unfamiliar JSON payloads, explain nested structures, propose candidate JSON schemas, and suggest transformations. Suggested schemas and outputs must be reviewed and validated with deterministic tools.

Other ideas to evaluate after learning from the prototype:

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

## How we prioritize

1. **Strengthen the foundation:** improve existing tools and fix issues that affect everyday use.
2. **Validate one idea:** build a small prototype with clear success criteria.
3. **Learn from real use:** assess correctness, usability, feedback, and operating costs.
4. **Expand thoughtfully:** release broader functionality only when it provides measurable value and can be maintained.

We do not publish speculative release dates. Priorities may change as we learn from users and technical constraints.

## First AI prototype - Technical considerations

The JSON Assistant remains a proposed prototype, not a deployed integration. Before a public release, we intend to:

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
