# Engineering delivery for Orvulix

This guide is for maintainers and AI assistants. Start with CONTRIBUTING.md for
setup, AGENTS.md for authority and the SDLC skill for delivery/merge rules. It
extends [engineering practices](ENGINEERING_PRACTICES.md), not a second workflow.
The [research record](AI_WORKFLOW_RESEARCH.md) explains source selection.

## Task sizing

| Change | Required design/evidence |
| --- | --- |
| Copy/docs or simple config | Scope, affected links/config, focused validation; no invented TDD cycle or ADR |
| Feature or bug | Behavioral spec and acceptance IDs in checkpoint, risk assessment, meaningful regression tests, full diff review |
| Parser/renderer/worker, dependency, CI or network boundary | Above plus threat/data flow, resource/lifecycle checks and security control selection |
| Cross-feature API, new service, architectural migration | Above plus ADR, compatibility/migration, rollback and operational ownership |

Keep one bounded task/branch/PR. Split a large initiative into independently
acceptable slices; do not implement the next slice automatically. Research spikes
must state their unanswered question and which output is experimental. A spike
does not meet feature acceptance merely because a demo works.

## Specification and executable acceptance

Define the user problem and before/after outcome before choosing libraries.
Record non-goals and relevant input/output formats, limits, privacy/network
behavior, supported browsers and failure recovery. Ask about unresolved product
decisions that would materially change behavior; do not ask for routine code choices.

Use stable acceptance IDs in the task checkpoint, for example:

| ID | Example behavior | Evidence boundary |
| --- | --- | --- |
| AC1 | Given two supported images, when converted, then the downloaded GIF has the specified dimensions/order/timing | Playwright download plus independent decoder |
| AC2 | Given corrupt input, when decoding fails, then the error is actionable and the next valid input still works | Parser test plus browser recovery flow |
| AC3 | Given conversion A in progress, when B replaces it, then A cannot publish a stale result and its resources are released | Lifecycle unit test plus native browser flow |

These illustrate BDD's shared behavioral examples. Use Vitest/Testing Library and
Playwright already installed; a Cucumber/Gherkin runner is unnecessary unless
non-developer stakeholders need to execute shared feature files. Test names and
assertions must communicate the business outcome, not private function call order.

Trace each actual task criterion to test/fixture, command and result at a SHA.
For manual checks describe reproducible steps and observation. If a requirement
changes, update the spec and affected tests in the same PR. Never write expected
values by calling the same algorithm being tested. An independent artifact decoder
or known fixture matters more than a coverage percentage.

## Domain boundaries and architecture

Orvulix is a modular browser application. Use feature language such as conversion
job, page range and output artifact; agree on meanings in the feature doc. A
bounded context is a rule/ownership boundary, not necessarily a deployed service.
Existing src/features modules and thin inherited route integrations are the
starting point. Keep src/pages/tools integration edits small for upstream sync.

For new/extracted logic, prefer this dependency direction:

```text
route/UI -> feature use case -> pure domain rules
                    -> browser/worker/codec adapter
```

Domain rules should accept/return typed values and enforce real invariants without
depending on React, MUI, DOM or worker construction when practical. Use-case code
owns orchestration, cancellation, deadlines and cleanup. Adapters contain actual
I/O/codec details. Keep types near their owner; avoid shared mutable state and
deep imports into another feature's internals. Export only a useful typed contract.
Do not impose these layers on trivial stateless tools or rewrite untouched code.

Strategic DDD is useful now: explicit terminology, boundaries, invariants and
ownership. Value objects can be plain validated TypeScript values. Entities,
aggregates, repositories, domain events and CQRS require actual identity,
consistency or persistence needs. There is no current database/backend requirement.
Generic conversion frameworks and microservices add maintenance cost without a
demonstrated shared contract. Preserve the SPA, existing stack and license notices.

An ADR is a short file under docs/decisions for a durable decision, with: context
and constraints; options including the simpler/status-quo option; decision and
reason; consequences/security/upstream impact; migration and rollback; owner/date
and status (proposed, accepted or superseded). Link related task/spec. Do not create
an ADR for every function or duplicate a feature doc. No new ADR is required when
the current decision already covers the change.

## Implementation and tests

For new nontrivial behavior and reproducible defects, use one vertical
red -> green -> refactor slice. Observe a failure for the intended behavior,
implement the smallest coherent change, then simplify under green tests. An import
error proves scaffolding is missing, not that the user's defect was reproduced.
For a behavior-preserving refactor, characterize existing behavior first. Do not
delete working code or user changes to manufacture a TDD history. Record honestly
when a test was added after implementation. Docs/copy need focused review instead.

Use pure tests for invariants and boundaries; DOM tests for interactions and
accessible state; browser tests for workers, downloads, navigation and actual
rendering. Assert decoded output when bytes/pixels/layout are the product. Mock
I/O/time boundaries deliberately and state the fidelity gap. Inherited fixtures
do not justify feeding untrusted files to a vulnerable test decoder.

For touched UI, inspect keyboard access, labels, focus, error/recovery and relevant
mobile layout. For heavy processing, establish input/output budgets, cancellation,
stale-result protection and cleanup; compare baseline/after measurements for a
performance claim. Do not use arbitrary sleeps or weakened timeouts/assertions
to turn flaky behavior green.

Read package.json before selecting commands. npm run lint currently includes
--fix; use a direct read-only ESLint invocation for scoped files instead of a
repository-wide auto-fix. Existing CI validates tests/builds; focused local checks
provide earlier feedback, and required latest-head CI remains a merge gate.

## Review, release and operation

Review the complete base/head diff twice: requirements/acceptance, then engineering
standards and [security controls](SECURE_DELIVERY.md). A second pass by the same
assistant is self-review. Never label it independent approval. Address blockers
and record bounded follow-ups with owner and acceptance; green CI is not review.
Do not claim a model can certify its own generated tests prove all requirements.

Before develop merge, the SDLC skill's acceptance/review/latest-head CI gates
apply. Before a separately authorized production release, follow
[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) against the complete release diff.
Record previous release, rollback route, unsupported/deferred capabilities,
privacy/network changes and operational owner. Static Pages evidence cannot prove
Netlify headers, redirects or Functions. Post-deploy verification belongs to the
authorized release and must reference the actual deployed revision.

Use reproducible reports, CI failures and available privacy-safe operational
signals to identify regressions. Do not add telemetry that captures user files,
document content or secrets. An incident record should connect symptom, affected
revision, mitigation, root cause evidence, regression test and owner of follow-up.
Scheduled dependency reviews already use Dependabot and the security workflow;
review advisory exceptions before expiry and scanner pins when updating tooling.
Do not install a paid AI-DLC platform or global agent hooks for these practices.

## Maintaining this workflow

AGENTS.md and development-workflow own authorization; sdlc-task-loop owns the task
lifecycle; this guide owns engineering choices; SECURE_DELIVERY owns the control
matrix. Skills route to those sources. A maintainer must be able to understand a
PR without the originating chat or a particular AI product. Keep setup commands,
specs, ADRs, tests and risk dispositions in the repository, not hidden chat memory.
Change policy through a scoped reviewed PR with rationale, not an accumulating
collection of mandatory upstream prompt packs. Reassess research quarterly or
when an incident, architecture change or tool update demonstrates a real gap.
