# Task checkpoint: code-result-clipboard

- Updated: 2026-10-15 Asia/Bangkok
- Branch/base: feature/code-result-clipboard / develop ef29d62
- PR: https://github.com/nguyenan97/orvulix-web/pull/31
- Delivery mode: develop-merge, one scoped task authorized
- Phase: final validation/review; resolve current head from Git before resuming.
- Prior checkpoint commit: ceb5573; runtime footer guard, regression cases and
  real-renderer browser setup remain uncommitted at this checkpoint.
- Preserve untracked public/sitemap.xml SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and evidence

PR30 is merged into develop, not main. Issue390 remains open; upstream PR452/430
are open and unmerged, not imported. At ef29d62, ToolCodeResult throws TypeError
reading writeText when clipboard is absent. The real-component unit regression
failed before the helper integration, then passed. Only Monaco is isolated in
unit tests; browser flows use the actual runtime CDN renderer 0.52.2.

Reuse unchanged PR30 writeResultText: code results copy their exact value,
including JSON escapes/indentation, never text-result decoding. Unavailable,
insecure, denied or synchronously throwing API gives bounded manual-copy guidance.
No deprecated fallback, permission probing or formatter/download transformation.

Native WebKit HTTP testing found a second actual error: Monaco's ancestor
click/keydown workaround blindly calls navigator.clipboard.write. Footer-only
code-gesture guard stops unsupported gestures propagating to that listener;
it never prevents default, and supported gestures still propagate. Two regression
cases failed before the guard; supported click/keydown propagation is also tested.
Other editor/input gestures are deliberately outside this scoped footer fix.

Acceptance: actual JSON prettify copies/downloads exact formatted JSON and valid
literal escapes. Native clipboard success, denial/recovery and actual insecure
HTTP policy are verified without disabling browser security. HTTP offers guidance,
not automatic copying. Do not mark all historical Umbrel/issue390 variants fixed.
Roadmap records verified PR30 develop delivery and retains twelve planned/partial
milestones; this unmerged extension is not advertised as production delivery.

## Validation and environment

- Full units after footer guard: 138 files, 1250 tests passed.
- Production build/typecheck after guard passed: 157 indexable static routes,
  matching sitemap, canonical/metadata/JSON-LD validation and true 404 artifact.
- Security tests: 26 passed. Audit gate: 15 package findings / 6 unique advisories,
  0 unaccepted high/critical; one pre-existing temporary acceptance unchanged.
- Style and working/full-PR whitespace checks passed before this checkpoint.
- Native test harness forwards genuine clipboard.writeText; Chromium additionally
  reads clipboard contents. Actual download bytes and JSON.parse are asserted.
- Test-only HTTP forwarding preserves actual isSecureContext=false/API absence;
  original Host is changed only for local artifact delivery, not Vite policy.
- Renderer assets are prefetched from the app's actual pinned CDN and fulfilled
  unchanged in tests; no editor mock. Follow inherited HTTP proxy/CA trust. This
  checks renderer integration, not CDN availability, offline support or performance.
- Firefox required the managed session CA in a temporary local NSS profile via
  a scratch launcher. No TLS bypass or repository/global browser setting change.
- An earlier native run passed 25/27; two WebKit editor-readiness assertions failed
  before Copy while full units ran concurrently. Diagnostic isolated run passed
  all three WebKit flows and observed asset HTTP 200s. Cause of transient readiness
  remains unconfirmed. Temporary diagnostics removed; final isolated 27-case native run passed
  on Chromium/Firefox/WebKit.
  No assertion, retry or timeout relaxation. Run browser work without full units
  competing for resources. Preview servers are Playwright-owned.

## Two-axis review and follow-ups

Standards: small upstream integration, isolated typed helper, existing dependencies,
no raw HTML, locale/hosting/routing/policy change or global Monaco patch. Footer
scope and supported propagation retained. Real renderer/clipboard boundaries are
explicit; unit mocks do not prove browser fidelity. No independent approval claimed.
Requirements: exact formatted code and downloads retained; unsupported/denied API
errors recover; actual HTTP pointer/keyboard asserts no pageerror; roadmap preserves
develop-only delivery and planned scope. Cross-browser acceptance passed; final Pages/CI gates pending.

Owner: Orvulix maintainer. Other input/file consumers and Monaco editor-wide HTTP
handlers need separate actual-origin reproduction, native error/recovery tests and
bounded fixes before claiming broader issue390 resolution. Production release and
main roadmap reconciliation remain separate; inherited audit/CodeQL findings are
not resolved by this task. Asset fixture URLs must track runtime loader changes.

## Next step

Build Pages (currently running) and run nine prefixed native
copy/HTTP/roadmap cases on three engines. Update PR with actual outcomes, commit
only scoped files (including new code-gesture.ts), push same head and verify exact
latest-head CI. Fetch develop again, review full diff and rules; merge matched head
only after every gate passes, verify merge and safely delete only this task branch.
