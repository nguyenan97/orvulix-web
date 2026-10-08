# Orvulix product roadmap

**Status:** Public planning document. Features marked planned or research are **not live**. Last updated: 2026-10-08.

## Product today

Orvulix is an independently maintained, open-source fork of [OmniTools](https://github.com/iib0011/omni-tools), providing free browser-based tools for JSON, text, PDF, images, and data conversion.

- Website: https://orvulix.io.vn/
- Repository: https://github.com/nguyenan97/orvulix-web
- Contact: founder@orvulix.io.vn

## Founder and current stage

Orvulix is currently developed by a solo founder as an unincorporated, self-funded project. It has not received external investment. A Claude Console account has been created using the project-domain email, but the project has not claimed approval for Claude for Startups or receipt of API credits. Anthropic determines program eligibility, including how it treats unincorporated projects.

## Problem and product direction

People routinely switch between small utilities to inspect, validate, convert, and explain data. Existing deterministic tools are useful for exact transformations; optional AI assistance could reduce the effort of understanding unfamiliar inputs, discovering the right tools, and preparing repeatable workflows. Orvulix aims to preserve free non-AI functionality and make AI use opt-in and transparent.

## Phase 1 — Focused developer AI (planned)

| Concept | User problem | Proposed Claude capability | Human verification |
| --- | --- | --- | --- |
| AI JSON Assistant | Hard-to-understand nested payloads | Explain structure, infer candidate JSON Schema, suggest transformations | Validate JSON and schema deterministically |
| Smart Data Converter | Mapping fields across JSON, CSV, YAML, XML | Propose editable field mappings and conversion steps | Preview, diff, and approve conversion |
| Regex Assistant | Regex patterns are difficult to create and debug | Generate examples, explain patterns, suggest test cases | Run regex tests locally and inspect edge cases |
| AI Tool Finder | Users cannot find the right utility quickly | Recommend Orvulix tools from a natural-language goal | User selects and runs tools |

**First proposed MVP (highest priority):** JSON explanation + candidate schema generation + deterministic validation, behind an opt-in interface. A reproducible demonstration and test results are the intended evidence of progress. This is a target, not an implemented feature.

## Phase 2 — Documents and API workflows (planned)

| Concept | Proposed value | Safeguards |
| --- | --- | --- |
| API Payload Inspector | Explain API requests/responses, compare payload versions, propose contract tests | Redact secrets, require consent, never send credentials |
| PDF Document Assistant | Summarize selected text, identify document sections, extract draft structured fields | Explain data transfer, input limits, confirm extracted data |
| Image Accessibility Assistant | Draft alt text and metadata for selected images | User review, size limits, supported media checks |
| Text Transformation Assistant | Rewrite, summarize, translate, and restructure selected text | Preserve original, review before replacing |

## Phase 3 — Connected workflows (research)

- **Visual AI workflow builder:** Chain existing utilities with explicit confirmation at each step.
- **Structured extraction templates:** User-editable extraction schemas and reusable validation rules.
- **Developer SDK and examples:** Reusable open-source components for AI-assisted utilities.
- **Multilingual task guidance:** Help users discover and operate tools in multiple languages.
- **Privacy-first processing controls:** Allow users to choose local deterministic processing instead of external AI whenever possible.

These are research directions, not committed releases.

## Proposed technical architecture (not implemented)

1. React/TypeScript UI collects only user-selected inputs with clear AI opt-in.
2. Server-side Netlify Functions or an equivalent backend call the Anthropic Claude API; secrets stay server-side.
3. Use structured responses and schema validation for machine-readable outputs.
4. Enforce authentication or abuse controls where appropriate, rate limits, payload limits, timeouts, and a spending ceiling.
5. Redact sensitive fields when feasible; show what will be transmitted before submission.
6. Provide graceful failure paths and preserve deterministic non-AI tools.
7. Publish provider/data-flow disclosures and update the privacy policy before release.
8. Measure opt-in usage and costs without claiming metrics that have not been collected.

## Proposed milestones and evidence

- **M1 — Prototype:** one end-to-end JSON use case, reproducible test cases, documented cost assumptions.
- **M2 — Private validation:** collect consent-based feedback on correctness, latency, usefulness, and failure cases.
- **M3 — Public beta decision:** privacy review, rate limits, spending safeguards, reliability, and clear user-facing limitations.
- **M4 — Expansion decision:** only prioritize additional assistants based on demonstrated demand and sustainable operating cost.

## Search and accessibility improvements

- Audit crawlable HTML and per-route canonical URLs, titles, and descriptions.
- Evaluate build-time static prerendering for key public pages and tool landing pages.
- Add helpful, original instructions, examples, and limitations to individual tool pages.
- Strengthen internal navigation between categories and related tools.
- Review Search Console indexing and performance reports after each release.
- Improve accessibility, mobile performance, and error-page HTTP behavior.

## Startup program transparency

Orvulix intends to apply to Claude for Startups as an early-stage, solo-founder, pre-incorporation project. Lack of external funding alone does not establish eligibility, and acceptance of unincorporated projects must be confirmed by Anthropic. Do not substitute a project launch date for a legal incorporation date on an application. Orvulix may apply to Claude for Startups. This document **does not claim** a live Anthropic integration, revenue, customers, incorporation, external investment, approval, or API credits. Applications must reflect verifiable facts and current eligibility requirements. The program's eligibility and credit decisions are made by Anthropic.
