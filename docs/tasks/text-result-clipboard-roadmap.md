# Task checkpoint: text-result-clipboard-roadmap

- Updated: 2026-10-15 UTC
- Branch/base: feature/text-result-clipboard-roadmap / develop e4233a0
- Delivery: develop-merge, one task explicitly authorized
- Phase: developing, uncommitted; PR not opened
- Preserve untracked public/sitemap.xml SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Discovery and acceptance

No open PR. PR29 confirmed merged. Candidates: shared text-result copy mismatch
(reproduced); braces remains 3.0.3 without a patched release; Text Workflow Builder
remains planned (larger feature). Choose demonstrated clipboard reliability before
new features. Upstream issue390 is still open; JSON prettify uses ToolCodeResult,
so this change does not claim to resolve that separate report.

At e4233a0, ToolTextResult shows decoded newline/tab but copies escaped source.
A real component regression failed at writeText expected newline/tab; first test
harness attempt lacked initReactI18next, corrected with a partial library mock
before the actual behavioral failure. Fix then passed that regression.

Acceptance: copy equals displayed text, including textarea CR/LF normalization;
keepSpecialCharacters preserves escapes; Unicode/empty values work. API missing,
denied or synchronously throwing gives actionable manual-copy guidance. No
execCommand fallback, permission probing, download transformation, input/code-result
clipboard scope or changes to conversion services. New helper in its feature
module, one small ToolTextResult integration.

Reconcile backlog/product/public roadmap: verify ancestry for PR19-29 against
both develop and main; show development-only delivery separately from 12 planned
features, retain acceptance details and partial GIF/lossless-PNG/Web boundaries.
Current clipboard change tracked here; no claim of production release or of a
merged PR before verification. Runtime and static roadmap share React-free data.

## Pending validation and resume

Expand unit coverage, browser clipboard and roadmap JS/no-JS parity across three
engines; production/Pages builds and prefix/noindex smoke; full units, security,
style/whitespace; full-diff Standards/Requirements review. One PR into develop,
exact-head CI, matched-head merge when gates pass, then safe branch cleanup.
No owned server. Resolve current Git/PR/check state before resuming; do not redo
merged task or start other backlog implementation. Main/hosting remain unchanged.
