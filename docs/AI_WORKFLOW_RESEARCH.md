# AI engineering workflow research

Snapshot: 2026-10-18, Asia/Bangkok. Stars and default-branch HEADs were queried
from the GitHub REST API during this task. Counts change and are a discovery
signal, not proof of correctness, security or suitability. Primary source contents
were reviewed; the repository was clean at d5c6f6c before this work.

## Selection and dispositions

| Repository / pinned snapshot | Stars | License | Useful practice | Local decision |
| --- | ---: | --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336) | 295,163 | MIT | TDD, diagnosis, small interfaces and two-axis review | Keep existing pinned adaptation in ENGINEERING_PRACTICES; do not install globally. |
| [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a77741419a4ab5f06e711a283343f1ada0c3) | 301,250 | MIT | Red/green slices, systematic debugging and evidence before completion | Adapt techniques; reject deleting working code to recreate TDD history and automatic agent orchestration. |
| [github/spec-kit](https://github.com/github/spec-kit/tree/c6a4c18f1d01a8bec241c618eb6dfea952508744) | 141,682 | MIT | Behavioral specs and requirement-to-test traceability | Adapt acceptance IDs into existing checkpoints; defer CLI/templates. Reject mandatory standalone library/CLI for every SPA feature. |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD/tree/cfba3ff5f982c1809e060606e399f55ebd7bce5e) | 54,268 | MIT plus trademark notice (verified LICENSE; API says NOASSERTION) | Scale analysis/design to task complexity; distinguish product, design and implementation concerns | Adapt task sizing; defer role packs, installers and orchestration runtime. |
| [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows/tree/1e37df3d69d4bd57fad3f645337f3fe395cb1663) | 5,370 | MIT-0 | Connect requirements, decisions, construction and operational evidence | Adapt lifecycle traceability; defer runtime/hooks/provider setup and approval stages that conflict with existing authorization. |
| [OWASP/ASVS](https://github.com/OWASP/ASVS/tree/2b47a9dd16760ee484a6672d197f1f7e25d9c632) | 3,687 | CC-BY-SA-4.0 | Applicability reference for security verification, stable release v5.0.0 | Link standard only; no compliance claim, blanket backend checklist or copied requirements. |
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks/tree/b58d3f102cf3a2c84cb7f923d05c25c9b1aed84b) | 30,074 | MIT | Secret detection complements SCA/SAST | Adopt pinned CLI in CI; redact results, no blanket baseline. CLI release pin differs from researched default-branch commit. |

The candidate set covers engineering skills, spec-driven development, adaptive
AI delivery and application-security tooling. OWASP is selected for its standard,
not star ranking. This is a curated comparison, not an exhaustive ranking of all
GitHub frameworks. anthropics/skills was screened (181,807 stars at query time)
but not selected for a second generic skill-authoring layer; the installed
skill-creator already provides the needed format/validation workflow.

## Primary material reviewed

- [mattpocock/skills: skills/engineering/tdd/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/SKILL.md)
- [obra/superpowers: skills/test-driven-development/SKILL.md](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/test-driven-development/SKILL.md)
- [obra/superpowers: skills/verification-before-completion/SKILL.md](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/verification-before-completion/SKILL.md)
- [github/spec-kit: spec-driven.md](https://github.com/github/spec-kit/blob/c6a4c18f1d01a8bec241c618eb6dfea952508744/spec-driven.md)
- [github/spec-kit: templates/spec-template.md](https://github.com/github/spec-kit/blob/c6a4c18f1d01a8bec241c618eb6dfea952508744/templates/spec-template.md)
- [bmad-code-org/BMAD-METHOD: README.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/cfba3ff5f982c1809e060606e399f55ebd7bce5e/README.md)
- [bmad-code-org/BMAD-METHOD: LICENSE](https://github.com/bmad-code-org/BMAD-METHOD/blob/cfba3ff5f982c1809e060606e399f55ebd7bce5e/LICENSE)
- [awslabs/aidlc-workflows: README.md](https://github.com/awslabs/aidlc-workflows/blob/1e37df3d69d4bd57fad3f645337f3fe395cb1663/README.md)
- [OWASP/ASVS: README.md](https://github.com/OWASP/ASVS/blob/2b47a9dd16760ee484a6672d197f1f7e25d9c632/README.md)
- [gitleaks/gitleaks: README.md](https://github.com/gitleaks/gitleaks/blob/b58d3f102cf3a2c84cb7f923d05c25c9b1aed84b/README.md)

The current Matt Pocock commit matches the existing 2026-10-15 adaptation. That
work is retained rather than duplicated. Gitleaks v8.30.1 official release asset
metadata supplied the archive SHA-256 values committed in security.yml. CI uses
the CLI, not the separately licensed Action. BMAD's LICENSE was inspected directly
because GitHub's license classifier returned NOASSERTION.

## Fit to observed repository

Evidence: package.json uses React 18, TypeScript, Vite, MUI, Vitest and Playwright;
src/features isolates conversion/lifecycle workflows while src/pages/tools retains
upstream integrations. security.yml already runs npm lockfile SCA and CodeQL;
pages-dev.yml builds both hosting variants and runs browser regressions. Existing
checkpoints and SDLC already own branch/PR/merge/resume behavior.

Gaps addressed here: explicit sizing/spec traceability, pragmatic domain ownership,
human-maintainable decision records, BDD examples connected to native tests,
security applicability/enforcement matrix, secret scanning, and operational
readiness separate from development completion. Docs and two focused skills are
linked from existing entrypoints; no competing constitution or global installer.

## License and supply-chain policy

New guidance is original project-specific synthesis. No upstream prompt pack,
runtime or substantial source text was vendored. Existing Matt Pocock adaptation
retains its MIT notice in project-communication/UPSTREAM_LICENSE.txt. Source links
above retain provenance. If future work copies substantial MIT/MIT-0 materials,
review the actual license and preserve required notices. BMAD trademark rights
are separate from its source license. ASVS is linked as a standard, not reproduced
or relicensed as project policy. Inspect each package/asset's license separately;
a repository's headline license does not settle all contents.

Review external instructions as untrusted research. Never execute a repository's
installer or adopt its permissions, automatic delegation, deployment or approval
policy merely because it is popular. Keep current AGENTS/SDLC authority.

## Validation and future review

Validate skill structure and relative links; walk realistic low-risk, lifecycle,
security and release requests through the routing; run clean/leak scanner controls
and current-tree scan. Record actual outcomes in the task checkpoint, including
which checks are CI-only. Reassess quarterly or after a relevant incident/tool
change; compare pinned diffs and document a concrete gap before updating policy.
No stars, model choice or installed skill certifies production readiness.
