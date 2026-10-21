# Task checkpoint: lossless-png-optimizer

- Updated: 2026-10-21 Asia/Bangkok
- Branch/base: feature/lossless-png-optimizer / develop 3f344d2c
- PR: https://github.com/nguyenan97/orvulix-web/pull/63
- Phase: reviewed; final artifact/Pages verification and exact-head CI pending
- Delivery mode: develop-merge
- Authorization: user requests the next project task prompt and execution from develop.
- Last verified tree: dace39d0 plus uncommitted test/SEO updates and indexed
  unfilter allocation cleanup. Resolve current head from Git/PR when resuming.

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
Native production flows passed9/9 across Chromium/Firefox/WebKit, workers1 and
retries0, then passed9/9 again with real built-worker timing observations. Every
fixture's downloaded scanlines/non-IDAT bytes and Jimp RGBA match input. Original
optimized349-byte PNG stays byte-identical. Corrupt CRC, excessive inflate and
trailing zlib data fail on all engines, followed by keyboard/mobile recovery.
Held genuine worker messages verify Cancel, replacement, Clear and navigation
termination plus recovery; queued success/error publication is covered in DOM tests.
Screenshots inspected on all engines at390px: escaped full filename wraps and
actions/download remain accessible. No content POST requests observed.

Full unit run initially had1964 passing /2 failing: new route increases exact SEO
override count37->38 and PNG status is now a bounded development MVP. Updated those
specific expectations; kept wording/content gates. Removed best-effort wording
from new SEO notes to satisfy the existing absolute-word matcher. Full rerun
passed190 files/1973 tests. Added separate delayed success/error DOM cases,
oversized replacement, every legal color/depth and tiny Adam7 plus unsupported
stream guidance. Focused feature/SEO suite39/39 passes.

Review found per-byte temporary predictor arrays in indexed unfilter; replaced
with direct branches (no semantic change). Focused39/39 and changed lint pass
after this cleanup; final production/Pages artifact reruns pending. Unaffected
full-app evidence above is reused only for unchanged code. Prior production
build passed164 indexable routes/142 tools, sitemap/404; Pages build passed165
dev HTML files and retained prefix/noindex. Initial Pages browser harness served
prefix assets as HTML due missing --base in scratch Vite preview command; HTTP
probes proved root JS worked but prefixed JS returned text/html. Stopped that
run, corrected scratch preview --base /orvulix-web/, kept assertions/deadlines
and app routing unchanged; rerun pending.

Requirements review: A1/A2 native corpus and parser boundaries evidenced;
A3 runner/DOM/native termination and URL ownership evidenced; A4 keyboard/mobile
and React text sinks reviewed; A5 production metadata/Pages build validated,
correctly served prefix smoke still pending. Standards/security self-review:
bounded worker-only binary processing, no preview/native image decoder path,
preserved opaque metadata, explicit unsafe/APNG rejection, .png download suffix,
no dependency/server/auth/persistence or hosting expansion. Original fallback
requires successful sample validation. No remaining code finding; final checks
must pass before merge. Self-review is not independent approval.

First-head security CI passed; SARIF metadata has the same five documented PR
rule/path findings (SEO validators/test helper, Pages transform and Markdown
formatter), no new result in this feature. Recompare final head before merge;
do not treat green CodeQL analysis as a findings gate.

## Resume point

Finish artifact reruns on reviewed code, update same PR around final evidence,
then required exact-head CI/rules/base/head and matched-head develop merge gates.
Resolve actual Git/PR state before resuming. Vite dev server on5173 returned HTTP200;
stop task-owned servers after verification. Playwright owns preview processes.
Local WebKit uses libraries supplied in previous feasibility scratch and its
documented host-probe workaround; actual native browser executes all assertions.
