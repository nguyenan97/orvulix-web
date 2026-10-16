# Task checkpoint: pdf-editor-consent

- Updated: 2026-10-16 Asia/Bangkok
- Branch/base: feature/pdf-editor-consent / develop 534f2a6
- PR: not opened; delivery mode develop-merge under AGENTS.md
- Phase: validating, implementation uncommitted. Resolve Git/PR state when resuming.
- Preserve untracked public/sitemap.xml SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and acceptance

Foundation issue301 is open. Current PDF Editor mounts SimplePDF immediately.
Unit integration regression confirms an external iframe exists before opt-in.
Synthetic one-page PDF live audit observed analytics/page-count/form metadata,
embed-origin POST and documentFingerprint metadata query. See PDF_EDITOR_PRIVACY.md
for transport boundaries and observations; do not claim every action is audited.

Add explicit per-mount consent before creating a provider frame, accurate
third-party disclosure and provider privacy link, close/re-enable control and local
PDF alternatives. Use the same empty-inline SDK1.9.0 URL as a native titled iframe;
no SDK documentURL/context/actions are used by this caller. This removes unused
wrapper effects/imperative messaging from the runtime integration, not the package
from the lockfile. No backend/dependency upgrade or local-editor rewrite.

Acceptance: no provider frame/request before enable; user gesture creates matching
origin/path without document/query data; close removes frame, re-enable is a fresh
instance, unmount/reload/new route visit defaults off; keyboard/mobile/dark and
provider failure allow recovery. Keep tool/SEO/static routes, Pages prefix/noindex.
Disclose analytics/fingerprints, not an unsupported local-only or no-upload promise.
Update roadmap with verified PR32 delivery; current privacy work remains partial
until its own gates/merge. Twelve planned milestones retained.

## Validation and review

Before-fix page-component unit failed expecting null iframe. ToolContent layout
alone mocked; real SDK mounted its iframe (unit emulator blocks actual network).
Actual provider loaded synthetic PDF and rendered canvas 100x133. Metadata only
recorded; no identifiers/query values/file bytes/cookies/headers persisted.
Browser outbound HTTPS forwarded unchanged through API client with inherited proxy
and CA; local Vite traffic stays native. Explicit browser-wide proxy first blocked
loopback (403); corrected routing, not policy/TLS bypass. An initial text-content
readiness locator did not match canvas-rendered text; canvas readiness then worked.
No performance/offline/save/share-completeness claim. After implementation: 24 focused tests passed (6 page/consent, 15 SEO model,
3 roadmap). Provider-after-opt-in live synthetic check also selected and rendered
the PDF (visible canvas 100x133); scroll into frame before checking the renderer.
An offscreen/hidden first canvas was a probe-readiness limitation, not a proven
provider failure. Full units, frozen production/Pages build, native gates and
exact-head CI remain pending.

## Resume point

Local dev Vite 127.0.0.1:5180 is task-owned; audit browser finished. Core under
src/features/pdf-editor-consent, page adapter kept small. Add regression network
coverage with controlled provider response for CI and a separate live synthetic
check after fix. Read actual current processes before rebuilding/previewing.


## Implementation checkpoint and review

Core native iframe uses the same SDK1.9.0 empty-inline URL; existing adapter uses
none of the SDK's messaging/document/actions. Native title/no-referrer are explicit;
provider origin visibility and retention are not promised away. No new dependency,
storage, listeners, timers, background jobs or paid service. External code remains
opaque/remote; no hard CPU/memory or upload guarantee is claimed.
Standards review: MUI/React18/Router preserved, useId and per-mount state, small
adapter/privacy/SEO integrations, no locales/hosting changes. Requirements review:
pre-connection disclosure/opt-in, deterministic teardown/new visit off, recoverable
provider failure, exact same default provider editor URL. Tests distinguish
controlled gate fixture from live provider rendering; save/share audit deferred
with owner/acceptance in PDF_EDITOR_PRIVACY.md. Self-review is not independent
approval. Acceptance and exact-head CI gates still pending.
