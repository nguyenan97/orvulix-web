# Task checkpoint: text-workflow-builder

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/text-workflow-builder / develop e4c39a650fa9d6f1d22cd57754dc1d4fec409361
- PR: not opened
- Phase: developing
- Delivery mode: develop-merge
- Authorization: user explicitly requested implementation of the preceding MVP
  prompt, through tests/review/exact-head CI and develop delivery. Main, production,
  paid services, security exceptions and other backlog features remain outside scope.
- Last verified tree: base e4c39a65 plus uncommitted feature/recipe/engine/runner/UI,
  tests, English metadata, string registry and SEO override. Inspect status on resume.

## Scope and acceptance

Text-only pipeline with trim, uppercase, grapheme reverse, duplicate lines, strict
UTF-8 Base64 encode/decode and URI component encode/decode. Explicit Run, editable
ordered steps, intermediate previews, final copy/download including successful
empty output. Input/config changes invalidate immediately, terminate the worker
and reject late replies. Failed steps retain only current successful intermediates.

Version-1 whitelist recipes contain configuration only, atomic import and validated
export. Input/output are never persisted or logged. Limits: input 65,536 UTF-16
units, 16 steps, each output 262,144 units, sum of retained outputs 1,048,576 units,
recipe file 32,768 bytes and recipe text 32,768 units, run deadline 5 seconds from
worker creation. Admission budgets are not a hard heap quota.

Route /string/text-workflow, thin meta/registry integration, preserve SPA and Pages
prefix/noindex. No new runtime dependency. Reuse uppercase/dedup services; stricter
Base64 and grapheme adapters stay isolated from legacy tool UIs.

## Discovery and design

Upstream #341 and #199 are open; PR392 remains open/unmerged. Its automatic
localStorage history/storage-event piping differs from this explicit, nonpersistent
MVP; do not transplant it or imply upstream acceptance. Repo skills and applied
engineering practices read. Browser references: Intl.Segmenter graphemes, fatal
TextDecoder, RFC4648 canonical standard Base64. Decode permits ASCII whitespace,
requires canonical padding/pad bits, rejects URL-safe/data-URI and invalid UTF-8.
Use worker + pure engine, one owning runner and a React hook; recipe readers have
independent cancellation. Render literal text without shared escape interpretation.

## Completed and pending

- Engine, fixed-depth recipe whitelist, native worker runner, hook and atomic
  recipe reader implemented. Six operations, budgets and controlled errors.
- UI implemented with stable internal step IDs, explicit Run/Cancel, intermediate
  outputs, final exports and configuration-only recipes; registry/English/SEO added.
- Focused Vitest: 62 tests passed (engine, recipe, protocol/runner, hook/reader,
  component integration using real engine and controlled worker I/O).
- Initial engine scaffold: 22 contract failures, then 23/23 engine tests passed;
  these were new-feature contract gaps, not existing-product bug reproductions.
- First typecheck passed. Later build caught an inferred never[] in browser test
  probe; annotated Probe. ESLint found prefer-const on runner timer; corrected.
- React skill applied: repository MUI retained, stable IDs for reorder, derived
  result ownership and cleanup. Native keyboard contract failed on Chromium;
  explicit focus after move/remove is implemented, revalidation pending.
- Production build after title correction passed: 158 indexable routes, 136 tools,
  SEO/sitemap pass. Earlier build rejected a 63-character title; shortened it.
  The uncommitted locale/metadata caused lastmod omissions, expected to resolve on
  the committed source tree; verify again in final build/CI.
- Source ESLint passed after corrections. Focused tests gained startup deadline
  and aggregate exact/one-over checks; latest run pending at this checkpoint.
- Feature docs/SEO, roadmap MVP status and browser CI selection added. Roadmap
  separates implemented text MVP from broader cross-tool/media plans and release.
- Pending: browser/native artifacts, limits responsiveness, remaining full checks,
  two-axis review, draft PR/CI, merge and cleanup.

## Validation and review

No full-suite/build/browser pass claimed yet. Existing security baseline is outside
this task; no dependency or policy changes. No user input is stored in checkpoints.

## Resume point

Run browser contracts against fresh build; fix focus as needed. Complete docs and
CI integration, review and draft PR. Owned dev session 1365 (127.0.0.1:5173),
fresh build session 8488, focused tests session 66947. Failed mobile browser run
13893 ended and its preview exited. Task scratch file work/text-workflow-pr.md.
Preserve branch and inspect actual PR/head on resume.
