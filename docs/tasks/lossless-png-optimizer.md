# Task checkpoint: lossless-png-optimizer

- Updated: 2026-10-21 Asia/Bangkok
- Branch/base: feature/lossless-png-optimizer / develop 3f344d2c
- PR: not opened
- Phase: implementing, focused validation passed; native/full checks pending
- Delivery mode: develop-merge
- Authorization: user requests the next project task prompt and execution from develop.
- Last verified tree: 3f344d2c plus current uncommitted task files.

## Scope and acceptance

[Prompt, boundaries and A1-A5](../LOSSLESS_PNG_OPTIMIZER.md). Implement PR62's
separate native-IDAT MVP, no dependency or production/hosting change.
Risk: untrusted binary parser/expansion, worker ownership and download lifecycle.
Use exact sample/chunk comparison instead of dimension-only claims. Existing
braces exception and CodeQL dispositions remain in SECURITY_REMEDIATION.md.

## Completed and pending

Latest develop is clean, PR62 merged, no open PR. Read mandatory development,
communication, SDLC, architecture and security instructions. Selected conservative
4 MiB/32 MiB budgets and explicit original retention; no user image preview.
Parser corpus acceptance test first failed against an explicit not-implemented
stub, then passed after implementation. Additional parser/engine/runner/UI tests
were added after code: 23/23 passed. Pure PNG parser checks CRC/core order, legal
depths, Adam7 expansion and indexed filter/palette references. Native stream
engine preserves samples/chunks with original fallback. Disposable worker owns
reading/parsing/processing; runner terminates on every settlement/cancel/deadline.
UI has no preview, explicit actions and current-owner URL cleanup; download names
always end in .png. Route, English copy, SEO/roadmap and focused Chromium CI adapter
implemented without dependencies or shared input changes.

Typecheck found two test-only issues (Testing Library exact option and Node Buffer
generic inference); corrected without runtime changes. Production build reached
Vite packaging, so TypeScript now passes. Focused lint initially found while(true);
replaced with equivalent for(;;). Full unit/lint/build running; audit passed with
unchanged 15 findings/6 advisory IDs and existing exception, security tests26/26.
Native tests cover real corpus downloads, corrupt/overexpanded/trailing data,
worker cancellation/recovery, mobile/keyboard and navigation; not run yet.

## Resume point

Open a draft PR at this reviewable checkpoint; finish production/native checks,
inspect artifacts/mobile and full diff, then Pages build/smoke and exact-head CI.
Resolve actual Git/PR state before resuming. Vite dev server is running locally
on5173 and returned HTTP200; stop task-owned servers after verification.
