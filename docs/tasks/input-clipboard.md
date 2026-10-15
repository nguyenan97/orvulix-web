# Task checkpoint: input-clipboard

- Updated: 2026-10-15 Asia/Bangkok
- Branch/base: feature/input-clipboard / develop 17c549d
- PR: not opened
- Phase: validating; implementation uncommitted
- Delivery mode: develop-merge under AGENTS.md standing authorization
- Last verified tree: base 17c549d plus explicit uncommitted input components,
  renamed code-gesture export/result import, input tests, existing browser specs,
  roadmap data/tests and docs. Resolve actual current Git head on resume.
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
Full units currently running; browser/Pages gates pending. New browser cases cover
raw imported input, actual editor changes, denied/recovery and HTTP footer keyboard.
PR31 roadmap delivery is reconciled; current input work is not advertised merged.
Security/style and two-axis full-diff review remain required before merge.

## Resume point

Finish full unit run before native browser work to avoid resource contention.
Check actual production artifact roadmap snapshot before browser tests. Keep small integrations;
keep temporary browser launchers/logs in /workspace/work. Read Git/PR state before
resuming. No other open PR at discovery. Full unit runner is task-owned; other processes must be reconciled from actual state.
No preview server is running yet.
