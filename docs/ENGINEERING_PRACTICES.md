# Engineering practices adoption

## Source and authority

Research snapshot: [mattpocock/skills](https://github.com/mattpocock/skills),
commit [49dd158d1076134a641b33efb035946536778336](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336),
reviewed 2026-10-15 Asia/Bangkok. MIT, Copyright (c) 2026 Matt Pocock; full
[notice](../.agents/skills/project-communication/UPSTREAM_LICENSE.txt) retained for these
adaptations. This is a local adaptation, not installation of the source plugin.
Local authority remains AGENTS.md and the existing development/SDLC skills.
The sources below are engineering references, not permission to publish issues,
spawn agents, merge, deploy or change global configuration.

## Adoption matrix

All source links pin the researched commit. Existing local standards were read
before identifying gaps; these additions supplement rather than replace SDLC.

| Practice / source | Orvulix evidence and existing coverage | Disposition / cost / verification |
| --- | --- | --- |
| [tdd](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/SKILL.md), tests.md, mocking.md | SDLC already requires regression coverage; GIF runtime tests mock worker boundaries, browser specs assert actual artifacts. Independent expected values and test-interface selection were not explicit. | Adapt behavior tests and small vertical slices; document what each test boundary misses. No mandatory user approval for routine tests or blanket ban on internal mocks. Low documentation cost; pilot uses literal pixels/metadata and real browser outputs. |
| [diagnosing-bugs](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/diagnosing-bugs/SKILL.md) | Project communication already requires reproduction. PR27 checkpoint records navigation readiness and a dev-only WebKit failure whose cause was unconfirmed. | Adapt smallest reproduction, falsifiable hypotheses, one-variable probes and debug cleanup. A deterministic failing production test is different from a dev-server observation. Do not require every bug to take seconds, invent a cause or use sleeps as browser readiness. |
| [codebase-design](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/codebase-design/SKILL.md), DEEPENING.md | Two GIF browser specs duplicate frame metadata/compositing; application feature modules already isolate upstream integrations. | Adapt small interfaces and locality where real callers share behavior; reject mandatory renaming of React components/services and speculative ports. Pilot has two real callers; runtime framework extraction deferred. |
| [code-review](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/code-review/SKILL.md) | SDLC has a broad full-diff review but no explicit separation of standards from requirements. | Adapt two separate review passes, then prioritize actionable blockers. Treat smells as heuristics. Do not invoke parallel reviewers or fabricate independent approval. Verify findings against fixed base/head and acceptance criteria. |
| [writing-for-agents](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/productivity/writing-for-agents/SKILL.md), SKILL-MECHANICS.md | AGENTS.md already points to three local skills. Repeating this research in each would add maintenance/context burden. | Adopt progressive disclosure: one pointer in project-communication to Applied practices here, no new always-loaded skill or AGENTS expansion. Check links, frontmatter, triggers and scenario walkthroughs. No measured token-saving claim. |
| [improve-codebase-architecture](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/improve-codebase-architecture/SKILL.md) | Recent history centers on GIF lifecycle/fidelity, making its duplicate test decoding a bounded candidate. | Adapt hotspot-first survey only. Defer full architecture survey; reject mandatory HTML/CDN report, grilling and sub-agent orchestration for this task. Markdown evidence and one pilot suffice. |
| [retro](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/retro/SKILL.md) | PR27 records actual readiness failures; package scripts/CI already enforce types, security and style. | Adapt evidence-based lessons and inspect existing automation first. No new broad lint workflow or settings changes. Verify the pilot and current check coverage instead of inventing guardrails. |
| [handoff](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/productivity/handoff/SKILL.md) | docs/tasks checkpoints already preserve branch/base/head, commands and resume points. | Defer a separate handoff skill/file. Retain durable repository checkpoint convention; link Git/PR evidence, redact secrets and avoid copying existing plans. No automatic quota reset/resume claim. |

## Applied practices

Consult the relevant paragraph for the task at hand. Authorization, delivery and
merge gates have a single source of truth in the existing workflow skills.

### Test design

Identify the observable interface and invariant before writing a test: what the
caller/user sees, which failure it catches, and which external boundary is mocked.
Use worked examples, specification literals, independently decoded artifacts or a
recorded known-good baseline as the oracle. Do not recompute the expectation with
the algorithm under test. Mock time/I/O/worker boundaries when needed; pair those
tests with real integration/artifact evidence when fidelity matters. Internal
mocks may be justified for lifecycle isolation; they do not prove encoder fidelity.

For new behavior/fixes, work one meaningful failing behavior -> minimal change ->
passing test at a time. For behavior-preserving refactors, establish characterization
coverage first, then refactor under green tests; do not manufacture a bug or claim
an absent-module import failure reproduced one. Routine interfaces/test choices
are resolved from scope and evidence, without an extra permission gate.

### Diagnosis

Capture a command/fixture with the exact symptom, then minimize while preserving
that symptom. For uncertain causes, list plausible falsifiable explanations and
change one variable at a time; scope depth to the uncertainty, not a mandatory
hypothesis count. Remove temporary probes after checking the original scenario.
Separate deterministic contract tests from stress experiments and dev-server
observations; never treat a guessed cause as confirmed. Performance changes need
comparable baseline/after measurements, not a complexity smell alone.

### Design and refactor

Identify actual consumers, caller obligations and the reason they change together.
Prefer a small typed interface that owns meaningful complexity. Extract only the
shared behavior, not whole tool frameworks or speculative adapters. State error,
ordering, ownership/cancellation and resource semantics where relevant. Preserve
existing domain names, React terminology and upstream integration locality.
Compare a focused extraction against leaving the code alone; if the benefit is
unconvincing, document the candidate and defer it. Do not delete tests just because
a source reference recommends replacing them; preserve their behavioral coverage.

### Review

Pin the merge-base and head. Review twice: **Standards** against local instructions,
types, security, lifecycle and integration constraints; **Requirements** against
scope, acceptance criteria, output behavior and omitted/extra work. Record findings
under their axis, with trigger, file, impact and evidence. Then prioritize blockers
without letting standards compliance excuse wrong behavior, or correct output
excuse a safety violation. Smells are design prompts, not automatic refactor orders.
Self-review is not independent approval. Apply the existing merge gates afterwards.

### Agent documents and resume

Keep one authoritative home per rule; link references at the step where needed.
Write trigger, concrete action and completion criterion rather than generic advice.
Read package scripts/configuration for current commands instead of copying a large
command inventory into every skill. Resume from actual Git/PR/CI and checkpoint;
record unknown/pending outcomes explicitly. These instructions guide behavior,
not a guarantee that every agent/client will obey.

## Pilot and alternatives

Pilot: consolidate the duplicated GifReader/frame metadata/pixel sampling in
src/features/gif-conversion/gif-lifecycle.e2e.spec.ts and mixed-format.e2e.spec.ts
behind testing/inspect-gif.ts. Both existing callers use the same (16,16) sample
and retained delta pixels; the second also samples the corner. The first keeps a
small local adapter from centers to its existing colors field. Route setup,
fixture creation, interactions and every existing assertion stay at their call sites.
The helper is test-only, not a general GIF player; disposal restoration is not
simulated, matching existing fixture inspection. No application runtime import.

Acceptance: literal metadata and a red full frame followed by a blue 1px delta
must retain the unchanged red corner; invalid bytes reject. Both native specs must
still download/decode real GIFs and pass unchanged behavioral assertions on three
engines. Revert the helper/imports and restore the two original inspectors to roll
back the pilot; runtime behavior is untouched either way.

The new interface test initially failed because the helper module did not exist;
that is contract scaffolding, not proof of a product bug. Its implementation then
passed the two literal fixture tests before either browser caller was migrated.
Existing browser assertions/baseline at merged PR27/6fab3c3 provide characterization.
Final native/full-suite validation is recorded in the task checkpoint and PR.

Rejected alternatives: a generic GIF/PDF job framework lacks equivalent consumers
with established shared semantics; refactoring the mixed-image header parser just
for testability would move cohesive behavior without demonstrating user benefit.
Merge PDF lifecycle and all backlog implementation remain outside this adoption.

No runtime speed, bundle-size, bug-rate or token reduction is claimed. The concrete
benefit is one implementation of fixture inspection used by two real consumers,
with a small tested contract and all caller assertions retained.

## Scenario checks and maintenance

Manual instruction walkthroughs, not model compliance evaluations:

| Scenario | Expected path / completion check |
| --- | --- |
| Bug fix | Existing authorization -> reproduce/minimize -> independent oracle -> fix/regression -> original symptom checked -> two-axis review and existing delivery gates. No mandatory interview. |
| Refactor | Show actual callers and characterization -> small change -> retain output tests. Pilot above exercises this path without a fake production bug. |
| Review-only | Pin diff/spec -> Standards/Requirements findings only. Existing review-only constraint still prevents edits, issue publishing and merge. |
| Interrupted task | Inspect working tree/PR/current head/base and checkpoint before work. Preserve user files; no automatic quota scheduling or assumption an old PR is open. |

Frontmatter and the trigger pointer belong to the existing project-communication skill, which the
unchanged AGENTS.md already requires. Recheck references and authorization after
editing this guidance. No plugin installation, new skills, global settings, issue
tracker setup, glossary/ADR proliferation or parallel orchestration was introduced.

Owner: Orvulix maintainer. Updates are manual: choose a new source SHA, review the
relevant skills/references/license diff and local conflicts, then make a scoped PR
with evidence. Source changes never automatically update project instructions.
