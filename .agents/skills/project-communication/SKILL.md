---
name: project-communication
description: Communication, project context and technical review standards for all Orvulix tasks.
---

# Communication

- Respond to the user in Vietnamese and keep technical terms in English. When
  asked to write an English email, message or document, use natural professional
  English. Preserve the existing language of product copy and documentation;
  this rule does not authorize translating the app or changing locales.
- Be direct, concise and conversational. Assume senior-level technical knowledge;
  skip basic explanations unless requested or necessary to explain a decision.
- Give specific recommendations and go deep on the relevant problem. Scale detail
  to the task: short answers for simple questions, evidence and tradeoffs for
  complex decisions. Avoid broad lists when a focused answer is more useful.
- Point out defects and risks plainly. Separate verified facts, assumptions and
  proposals. State uncertainty explicitly; do not invent sources, test results,
  adoption metrics, deployment status or technical details.
- Ask concise questions only when essential requirements are unclear and cannot
  be resolved from the repository or conversation. Continue independent work
  while waiting. Follow existing authorization and Git workflow rules.
- Avoid generic introductions/conclusions, unnecessary disclaimers, flattery,
  repeated questions, canned AI phrasing and overly formal templates. Use headings
  and lists only when they improve readability. English messages should sound
  like a colleague wrote them, not marketing copy.
- Never use em dashes (Unicode U+2014), including in chat. Use regular hyphens (-).
  Run `node scripts/check-text-style.mjs` for repository changes.

# Actual project context

- Orvulix is a fork of `iib0011/omni-tools`: Vite, React 18, TypeScript, MUI and
  React Router. Inspect current dependencies/configuration before choosing an
  implementation. Default examples to TypeScript/TSX or Node.js for this project.
- The user's .NET, Angular, SQL Server and Azure experience is background context,
  not this repository's stack. Do not introduce C#, Angular, a database or Azure
  services without a relevant, explicitly scoped requirement.
- Production is Netlify from `main`; development is GitHub Pages from `develop`.
  Pages is static hosting and does not execute Netlify Functions, redirects or
  response headers. Preserve Pages base path and noindex. Use local development
  and builds for testing; production deploys require explicit authorization.
- Preserve the SPA and existing directory structure. SSR is outside the current
  SEO scope. Keep new feature modules isolated and upstream integration changes
  small; preserve licensing/attribution and document sync hotspots. Avoid bulk
  formatting, tool rewrites or locale edits unrelated to the task.
- Prefer existing dependencies, browser APIs and plain Node scripts. New runtime
  dependencies need a concrete benefit plus maintenance, bundle-size and license
  review. Local assistant demos are not live Claude integrations; do not imply
  provider calls, program eligibility or approval. Paid inference is outside the
  current demo scope unless the user changes that requirement.

# Implementation and review

- Recommend practical changes with explicit scope and acceptance criteria.
  Consider performance, security, maintainability and scalability where material,
  rather than adding speculative infrastructure or boilerplate checklists.
- For browser tools, assess UI blocking, large inputs, worker cancellation,
  resource cleanup and heavy asset loading. Validate user-controlled data and
  render text safely. Distinguish remote asset downloads from input uploads;
  verify network behavior before claiming local-only processing.
- Read existing code and upstream issue/PR status before declaring a feature
  missing or a bug fixed. An open upstream PR is not an accepted or verified fix.
  Reproduce reported bugs and keep regression tests focused on observed behavior.
- Run checks proportionate to the change and required by the workflow. Report
  what passed, what was not checked, and any material limitation. Documentation
  changes do not need new runtime tests; do not run broad auto-fix commands.
- Review findings should name the affected location, trigger, impact and a
  practical correction. Report blockers first. Do not promise merges are risk-free
  or claim instruction files enforce behavior across every client.
- Delivery summaries should state what changed, why, validation and the PR/commit
  link. The standing SDLC workflow authorizes merging the current implementation
  task into `develop` only after its gates pass; creating a PR alone is not a
  completion gate. Review-only/stop-at-PR instructions override the default.
  Releasing into `main` still requires explicit authorization. Follow
  `development-workflow` and `sdlc-task-loop` for delivery and safe cleanup.
