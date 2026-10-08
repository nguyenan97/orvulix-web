# Orvulix product roadmap

**Status:** Planning document. Features described as planned are not live product capabilities.

## Product today

Orvulix is an independently developed website offering free browser-based utilities for developers and general users, including JSON, text, PDF, image, and data-conversion tools.

- Website: https://orvulix.io.vn/
- Product contact: founder@orvulix.io.vn
- Repository: https://github.com/nguyenan97/orvulix-web

## Problem and audience

Developers and everyday users repeatedly need small utilities to inspect, transform, and validate data or files. Orvulix aims to make these tasks accessible through a single website without requiring a separate desktop application for each task.

## Planned: AI JSON Assistant (Claude API)

**Status: Planned; not implemented, released, or available to users.**

The proposed feature would let users submit JSON for an AI-generated explanation of its structure, plain-language validation guidance, and suggestions for transformations. It would complement deterministic JSON formatters and validators, not replace them.

**Proposed architecture (not implemented):**

1. An opt-in interface lets users review and explicitly submit their content.
2. A server-side Netlify Function authenticates to Anthropic's Claude API. API credentials must never be embedded in browser JavaScript.
3. Input-size limits, rate limiting, abuse prevention, timeouts, error handling, and spending limits protect the service.
4. The product clearly discloses that submitted content is sent to a third-party AI provider, with an updated privacy notice before release.
5. Responses are advisory; deterministic validation remains available without AI.

**Initial success criteria (targets, not achieved metrics):** a working end-to-end prototype, reliable failure handling, a documented privacy/data flow, a cost-controlled trial, and user feedback on usefulness.

## Other potential improvements

- Improve search, discoverability, accessibility, and mobile usability of existing tools.
- Add automated checks for sitemap correctness, routing, and production SEO metadata.
- Evaluate privacy-preserving analytics and measure real usage only after implementation.
- Maintain public product documentation and changelog.

## Startup program and evidence

This roadmap is intended to describe product direction transparently. It is **not evidence of an existing Claude integration**, paid customers, revenue, fundraising, incorporation, or acceptance into any startup program. Any future application should use only verifiable business and technical information and follow the program's current eligibility rules.

Last updated: 2026-10-08.
