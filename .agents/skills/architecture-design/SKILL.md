---
name: architecture-design
description: Define domain boundaries, behavioral specifications and maintainable designs for Orvulix features, substantial refactors or new integrations. Use before implementation when contracts or architectural tradeoffs change, not for copy edits.
---

# Design for humans and executable acceptance

Read [the engineering delivery guide](../../../docs/ENGINEERING_DELIVERY.md),
sections Task sizing, Specification and Domain boundaries. Existing workflow and
SDLC skills retain delivery authority.

Inspect actual consumers and adjacent feature documentation before proposing
layers. Record the user outcome, domain terms, invariant, boundary/ownership and
smallest viable integration in the task checkpoint. Resolve material product
ambiguity with the owner; identify routine technical choices and their rationale.

For behavioral changes, give acceptance IDs and concrete Given/When/Then examples
covering success, meaningful failure and lifecycle/resource boundaries. Map each
to the lowest useful test boundary and a command or manual observation. Record
what mocks cannot prove. Keep specification, tests and implementation consistent.

Apply strategic DDD to existing feature modules. Extract pure domain rules when
they make invariants clearer; keep React and browser/codec effects at boundaries.
Introduce tactical DDD patterns only when actual identity, transactions or
consistency rules require them. No repository classes, event bus, CQRS or backend
solely to satisfy a methodology. Do not move the inherited tool tree wholesale.

For cross-feature contracts, new dependencies or privacy/hosting decisions, add
a concise ADR using the guide's format, including a rejected simpler option,
migration/rollback and upstream impact. Link existing decisions instead of copying.

Complete when a maintainer can explain the flow and tradeoff from the diff and
repository docs, acceptance is observable, and no essential product decision is
silently guessed. Do not install external workflow runtimes or spawn agents merely
because a research source recommends them.
