# Task checkpoint: code-result-clipboard

- Updated: 2026-10-15 UTC
- Branch/base: feature/code-result-clipboard / develop ef29d62
- Delivery mode: develop-merge, one scoped task authorized
- Phase: developing, uncommitted; PR not opened
- Preserve untracked public/sitemap.xml SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and evidence

PR30 verified merged, no open PR. Continue its explicit code-result follow-up,
not another conversion feature. Issue390 remains open; upstream PR452/430 are
open and unmerged, not imported. At ef29d62, real ToolCodeResult with only Monaco
mocked at the editor boundary throws TypeError reading writeText when clipboard
is absent. Regression failed before the one-helper integration, then passed.

Reuse PR30 writeResultText without modifying it: code results copy their exact
value, including valid JSON escapes/indentation, never text-result decoding.
Unavailable/insecure/denied/synchronously throwing API gives guidance; no fallback,
permission probing, input/file clipboard changes or formatter changes. Keep raw
downloads, Monaco display, MUI, dependencies, hosting and routing unchanged.

Acceptance: actual JSON prettify flow copies/downloads formatted JSON; literal
escapes remain JSON-parseable. Native clipboard failure/recovery and secure/insecure
origin policies are verified without disabling browser security. Do not claim
all Umbrel/issue390 variants fixed merely from an unavailable-API regression.
Roadmap: record verified PR30 delivery and current partial code-result work, keep
12 milestones and develop-only/no-production distinction. No original prompt file.

## Validation and resume

20 focused cases pass (8 new code-result + 9 retained text-result + 3 roadmap). Production
build/typecheck passed: 157 indexable route files/sitemap and 404. Native testing uses actual Monaco 0.52.2 from the existing runtime CDN, not a
mock. Chromium and Firefox flows passed; WebKit is running. Initial Firefox
SEC_ERROR_UNKNOWN_ISSUER was diagnosed and resolved by trusting the session proxy
CA in a temporary local NSS profile via a scratch launcher, not disabling TLS.
A subsequent HTTP artifact-forwarding Host mismatch was caught by Vite and fixed
in the test harness (correct localhost Host); no allowedHosts/security change.
Temporary diagnostics removed. No retry/timeout/assertion changes. Roadmap now records PR30 merge ancestry (ef29d62, not in main), seven
development entries, twelve milestones unchanged. Full units running. Pending
fresh final build, native/Pages smoke, security/style/whitespace, two-axis
review, one PR/exact-head CI/merge/cleanup. The custom native preview 4173 is
Playwright-owned and must finish before rebuilding artifacts.
