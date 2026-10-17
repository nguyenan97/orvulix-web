# Task checkpoint: text-workflow-builder

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/text-workflow-builder / develop e4c39a650fa9d6f1d22cd57754dc1d4fec409361
- PR: https://github.com/nguyenan97/orvulix-web/pull/40
- Phase: locally validated and reviewed; exact-head CI and develop delivery pending
- Delivery mode: develop-merge. User requested implementation of the preceding
  text MVP prompt. Main, production, paid services and other backlog tasks excluded.
- Tree: pushed checkpoint 227f56bb154bf1411cdd6704b68c7dfc0f83ff9e plus
  uncommitted preview/lifecycle/test refinements and this checkpoint. Resolve the
  latest head from Git/PR; this file cannot record its own containing commit SHA.

## Accepted scope

Route /string/text-workflow. Six ordered operations: trim, uppercase, grapheme
reverse, duplicate lines, strict UTF-8 Base64 and URI component encode/decode.
Explicit Run/Cancel, editable/reorderable steps, selectable full intermediates,
current successful final copy/download, including empty output. Source/config
edits synchronously revoke exports, cancel workers and reject late replies.
Failed steps retain only successful intermediates from the current run.

Version-1 recipes use a fixed-depth whitelist and contain configuration only.
Atomic import, replacement/edit/unmount reader cancellation and generic errors;
invalid import preserves current steps/results. No automatic persistence or input
logging. No new dependency, legacy tool rewrite or hosting/security policy change.

Limits: source 65,536 UTF-16 units, 16 steps, output 262,144 units, sum of emitted
outputs 1,048,576 units, recipe file 32,768 bytes/text 32,768 units, worker deadline
5 seconds from construction start. Admission budgets are not a hard heap quota.
Worker/reader ownership and error/recipe contracts: ../TEXT_WORKFLOW.md.

## Validation evidence

Application refinements below are uncommitted over 227f56b. Local commands ran
against this source; final GitHub checks must validate the eventual exact head.

- Focused Vitest: 72 tests / 8 files pass, including 64 new feature tests.
- Full `npx vitest run --maxWorkers=2`: 155 files / 1,459 tests pass, 134.70s.
  Existing localhost locale/disabled PDF iframe stderr did not fail tests.
- Changed TypeScript/TSX ESLint with max-warnings=0 passes.
- Fresh production build: typecheck, 158 indexable routes, 136 tools, sitemap/SEO
  validation pass; 151 lastmod URLs. Worker asset is 32.92 kB before gzip.
- Native production Playwright, workers=1/retries=0: 27/27 on Chromium, Firefox
  and WebKit, 129.18s; skipped/unexpected/flaky all zero. Real module workers,
  clipboard forwarding/readback, downloaded literal bytes, invalid imports,
  settings, lifecycle, maximum budgets, keyboard/mobile/dark and no-JS metadata.
  Cancel/deadline scenario deliberately withholds native worker I/O in tests;
  other scenarios submit real work. No production test hooks.
- Desktop 1440px/mobile 390px dark screenshots inspected: readable, no overflow.
- Security harness 26 pass; fresh audit unchanged 15 findings / 6 advisories,
  existing exact braces exception. No exception/dependency changes.
- Pages prepare regression: 1 pass. Fresh Pages build produces 159 HTML files;
  root/tool/roadmap/404 checked for noindex, no canonical and prefixed assets.
  Prefixed native Playwright: 27/27 across all three browsers, retries=0.
- CI browser selection enumerates 171 tests / 26 files. Existing tests retained.
  Initial PR CI227f56b failed the obsolete editorial inventory ceiling after the
  new page (31 vs 30). Now exact 31 with existing content assertions retained and
  a workflow deadline disclosure assertion. Latest-head CI remains pending.

## Review dispositions

Standards pass: isolated feature module, thin registry/meta/English/SEO changes;
no runtime dependency or production/Netlify change. Fixed-depth reconstruction,
literal rendering, bounded worker replies, all terminal cleanup, no storage/input
network transport. Existing MUI conventions retained after React skill review.
Pages prefix/noindex and existing 404 preserved. Full diff reviewed against base.

Requirements pass: all six literal output contracts, strict encodings/graphemes,
ordered options, valid empty exports, failed-step previews, synchronous export
revocation, atomic recipe replacement and late-reply rejection covered. Roadmap
marks only text MVP implemented for development; media/cross-tool and production
remain planned. Self-review is not independent approval; inspect GitHub rules.

Findings fixed and revalidated: unsupported unit-test locator option/type inference;
SEO title length; MUI accessible names; focus after move/remove; event-time export
revocation; oversized preview rendering. Sixteen simultaneous large textareas
blocked page queries through the unchanged 30s test deadline. One selected full
intermediate plus final now passes the same budget/output assertions on all three
engines. Whole multi-run budget tests took 11.72s / 5.05s / 4.91s, not transform
latency or an SLA. No deadline/retry increase or behavioral assertion removal.

Upstream issues341/199 and PR392 reviewed open/unmerged; automatic storage/history
piping is a different scope. Existing security baseline remains outside this task;
final CodeQL must introduce no new finding. No unresolved task-blocking finding.

## Resume / remaining gates

Run style/diff checks, commit/push only task files on PR40, update PR body and mark
ready. Require exact-head Security and Pages CI, re-fetch develop, inspect real
reviews/rules, matched-head merge into develop, verify merge ancestry/tree and safe
task-branch cleanup. No main release. Develop was re-fetched unchanged at e4c39a65;
only this PR is open, and develop rules currently forbid deletion/non-fast-forward.

Owned transient files under work/: text-workflow-pr.md, text-workflow-native.json,
text-workflow-pages.config.ts, work/text-workflow-pages.json, text-workflow-visual.mjs,
text-workflow-desktop.png, text-workflow-mobile.png. Reports/screenshots are not
committed. Playwright previews and prior dev watcher have exited. Remove only
verified task-owned scratch files at delivery.
