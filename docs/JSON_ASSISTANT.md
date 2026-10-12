# Local JSON Assistant prototype

Route: `/json-assistant`. This branch implements a prototype; merging its feature
PR into `develop` publishes it on GitHub Pages. It reaches Netlify production
only after an explicitly authorized `develop` -> `main` release.

## What works without funding

- Three authored explanations match their sample payloads regardless of object
  key order. Custom inputs never receive a fabricated sample answer.
- Explicit acknowledgement precedes requesting a sample explanation. Input
  changes clear acknowledgement, previous results and schema, and cancel pending
  work. Loading and a clearly labelled simulated error can be exercised.
- Custom JSON supports deterministic schema inference and local structural
  validation; these are ordinary algorithms, not AI inference.
- Input remains in component memory; the demo has no fetch, storage, upload,
  backend endpoint or AI dependency. The surrounding site still downloads its
  assets and translations and stores interface preferences. Hosting requests
  are distinct from transmitting the demo's input.
- There is no paid model inference. Hosting/CI still follow their providers'
  quotas; no claim that the entire website has zero operating cost is made.

## Schema limits

Input: 16 KiB UTF-8, at most 20 nesting levels and 2,000 values. Schema:
64 KiB, 60 levels and 12,000 values to accommodate wrapper objects. Invalid
JSON and non-finite numbers are rejected. Generated candidates use compact JSON
when indentation would exceed the schema byte limit. Generation checks the same
validator limits before displaying a candidate; inputs whose schema still exceeds
the budget receive an explicit error instead of an unusable candidate. Supported keywords: `type` (one type),
`properties`, `required`, boolean `additionalProperties`, `items` (one schema),
and standalone `anyOf`; an optional draft-07 declaration is accepted at root.
Unsupported keywords and malformed schemas fail explicitly. This is a documented
subset, not a full JSON Schema implementation. Inferred fields are required,
extra properties are disallowed, empty arrays have unconstrained items, and
mixed arrays use a union. Null-only samples stay null-only. A single payload
does not establish optional fields, formats, allowed values or business rules.

## Files and future adapter

`src/ai/json-assistant/` contains the lazy page, copy, fixtures, provider boundary,
pure schema algorithms and tests. The existing router adds a small integration;
the roadmap links to the demo. Tool implementations and locale files remain untouched.

`AssistantProvider` currently accepts input plus an abort signal and returns an
explicit `authored-sample` result. A future adapter must add a distinct mode and
source for real output; never relabel fixtures as Claude output. Put the Claude
SDK and credentials in a server handler, never a Vite variable or GitHub Pages
bundle. GitHub Pages cannot run that server handler. Keep the local provider
available without an API key and use a feature flag disabled by default for live
inference. Before enabling it:

1. Obtain API access/funding; confirm current provider/program terms separately.
2. Require separate consent explaining exactly which input leaves the browser.
3. Enforce server-side input/token limits, authentication or abuse controls,
   timeouts, rate limits and a hard request budget; an origin check alone is
   insufficient. Do not log payloads/secrets. Abort client requests when cancelled.
4. Treat output as untrusted text/data, validate structured responses, disclose
   the provider, and require review before applying transformations.
5. Test timeout, quota exhaustion, malformed output and provider errors with
   mocks. Measure latency, correctness and cost only with real authorized trials.

No live adapter is shipped prematurely. No API key field is shown to users.

## Honest startup evidence

This is an implemented local UX and deterministic-processing prototype, not a
working Claude integration. Demo screenshots, source and passing tests can
demonstrate what exists. Explain that provider access is the next milestone;
do not claim AI accuracy, adoption, revenue, incorporation or Anthropic approval
without evidence. Do not publish invented metrics. Program eligibility and
acceptance remain Anthropic's decision.

## Maintenance and verification

`npm run typecheck`, `npm run test -- --run`, `npm run build`, then the focused
Playwright specs for SEO and the JSON Assistant. Pages uses
`node scripts/pages/build.mjs`; preserve its repository prefix and noindex.
New samples require an honest explanation and an exact matching fixture.
Upstream merge hotspots: router, `src/seo/pages.ts`, and CI. Keep the
new module separate and resolve integrations against new upstream route APIs
rather than editing inherited tool code.
