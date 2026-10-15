# Task checkpoint: input-clipboard

- Updated: 2026-10-15 Asia/Bangkok
- Branch/base: feature/input-clipboard / develop 17c549d
- PR: https://github.com/nguyenan97/orvulix-web/pull/32
- Phase: review fixes, uncommitted browser diagnostics/checkpoint
- Delivery mode: develop-merge under AGENTS.md standing authorization
- Last verified runtime: eb0f39215997de9c4ef5192d663b693a3f2d2364 (base develop
  17c549d). Browser test corrections/checkpoint currently uncommitted; resolve Git
  status/head and PR checks when resuming.
- Preserve untracked public/sitemap.xml SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and acceptance

Scan confirms ToolTextInput and ToolCodeInput access clipboard.writeText before
promise catch, unlike merged result fixes. Fix these two shared input footers,
retaining exact input values (no output decoding), editing and file import.
Reuse native writer and unsupported gesture policy from PR30/31 without changing
supported event behavior. Name shared gesture helper for its broader footer use.
No deprecated fallback, permission probing, dependencies, editor-wide gesture
patch, file/diff-result migration, formatter or file-reader lifecycle change.

Acceptance: absent/insecure API shows HTTPS/manual-copy guidance, denied/synchronous
failure is bounded and later copy recovers, latest input is copied exactly,
code footer pointer/keyboard does not reach unsafe Monaco ancestor on HTTP.
Native flows must use actual clipboard and Monaco, plus regression result tests.
Update roadmap with verified PR31 merged develop scope; preserve twelve planned
milestones, SEO/404, Pages prefix/noindex and main/hosting settings.

## Validation and review

Upstream issue390 and PR452/430 rechecked OPEN/unmerged. No code imported and no
claim that every historic Umbrel variant is fixed. Real-component baseline: 8 failed / 6 passed before fix (missing API, sync failure,
insecure policy and private-error leakage). After helper integration and input
footer guard, 37 focused unit tests passed (16 new plus existing result coverage).
Production/typecheck build passed: 157 matching indexable routes/sitemap and 404.
Full units at that runtime passed: 139 files / 1266 tests. Browser/Pages gates
pending. Earlier local artifact build overlapped roadmap edits: static HTML had
8 entries but SPA had 7. Fresh frozen-tree build required, not weaker assertions. New browser cases cover
raw imported input, actual editor changes, denied/recovery and HTTP footer keyboard.
PR31 roadmap delivery is reconciled; current input work is not advertised merged.
Security:test 26 passed; security:check passed with inherited 15 package findings /
6 advisories, 0 unaccepted high/critical, one temporary acceptance unchanged.
Security CI at eb0f392 passed, same five inherited CodeQL findings by rule/path/line.
Style/full-diff whitespace checks passed before review corrections.

## Review corrections and current validation

Real WebKit HTTP file chooser reproduced missing clipboard.write from Monaco's
ancestor when the footer programmatically clicks its hidden input sibling.
Independent unit regression failed (1 failed / 16 passed). Move the hidden input
inside the same guarded footer: no reader/options/default-action change.
Focused suite after fix: 41 passed (17 input, 12 code-result, 9 text-result,
3 roadmap). Fresh full units and frozen production build are running.

The editor diagnostic showed active textarea but unexpected trailing/original
source bytes after bulk insertText. Use actual textarea focus, select-all shortcut
matching Monaco's UA-based Macintosh policy (official 0.52.2 platform.js verified),
Backspace with empty-model readiness, then real per-key typing. Exact source-model
and copied-byte assertions remain. No programmatic setValue, editor setting change,
retry/deadline increase or removed output assertions. HTTP tests now isolate
input/result contexts and exercise actual file chooser before Copy. Keep duplicate
snackbars from making the selector ambiguous instead of changing product to suit it.
Temporary diagnostic console output removed. Renderer initialization is an actual
model-ready condition, within the unchanged overall test deadline, before retained
2-editor and exact formatted-model assertions. This is not a load-performance test.

Two-axis self-review: Standards retains React18/MUI and small upstream integration,
existing helper/dependencies, footer-only event boundary, no input data persistence,
no routing/hosting/security-policy change. Requirements retains exact input bytes,
editing and actual file chooser, native failure/recovery, existing result/download
regressions and truthful roadmap snapshot (PR31 delivered, current input pending).
Broader input-file reader lifecycle, file/diff consumers, editor-wide gestures and
pending-copy notifications are scoped follow-ups owned by Orvulix maintainer,
requiring separate reproduction, ownership/error/recovery acceptance. Self-review
is not independent approval. Final browser/Pages/exact-head CI gates still pending.

## Resume point

Current branch feature/input-clipboard, PR32 into develop, prior runtime eb0f392
plus hidden-input placement and browser/checkpoint corrections uncommitted. Resolve
actual head/CI before acting. Full units own a process; no preview currently owns
4173. Finish full units/build, native 45 cases and Pages smoke with actual input
copy/edit/import and roadmap. Do not rebuild while preview runs. Save/push the
scoped checkpoint, update PR evidence, validate exact new head CI, recheck develop
base/rules, merge only after all gates pass and safely clean only task branch.
