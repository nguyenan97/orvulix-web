# PDF Editor: external-service consent and bounded audit

Research/observation date: 2026-10-16 Asia/Bangkok. Base develop 534f2a6;
implementation/delivery is tracked by tasks/pdf-editor-consent.md and its PR.
This document is a measured snapshot, not a privacy certification of remote code.

## Finding and correction

The inherited /pdf/editor mounted @simplepdf/react-embed-pdf 1.9.0 immediately.
A real page-component unit regression expected no frame before opt-in and failed:
the SDK created an iframe with https://react-editor.simplepdf.com/en/editor.
Native browser observation confirmed that initial provider navigation before any
application consent control or PDF selection. Upstream issue
[301](https://github.com/iib0011/omni-tools/issues/301) remains open; its historical
GraphQL examples are not the same endpoints observed in this snapshot.

The new isolated consent component creates a native iframe only on Enable
SimplePDF editor. Close removes it; reload/unmount/new tool visit starts disabled.
No choice/document/identifier is stored by the Orvulix component. Same control
retains keyboard focus and exposes expanded state; privacy and PDF-category links
remain visible. Third-party failures do not remove the parent close control.

The native frame uses the SDK1.9.0 default empty-inline URL, with a descriptive
title and referrerPolicy=no-referrer. The old caller used no documentURL, context,
callback or imperative action, so it needs no SDK message bridge. This does not
make the provider anonymous: it still receives normal network information and
may determine/embed-record a parent origin. No sandbox/permission policy change
or promise of anonymous/local-only operation is introduced. The existing package
remains installed in package/lock files; unused-dependency removal is separate.

## Live observation method and boundaries

A synthetic one-page 300x400 PDF containing an explicit audit marker was generated
with existing pdf-lib; no user file or credentials were used. It was selected in
the provider file input and a visible 100x133 canvas confirmed rendering. Request
metadata was collected until that readiness point, not after an arbitrary sleep.
Recorded only origin/path/method/resource type/body length and JSON field names;
no PDF bytes, fingerprint values, query values, cookies or header values retained.

Managed cloud HTTP policy was unrestricted/enforced. A browser-wide proxy first
blocked local loopback with 403; the working audit kept local Vite traffic native
and forwarded outbound HTTPS requests/responses unchanged through Playwright's
API client with inherited proxy and CA verification. This transport boundary can
affect browser cookies/service-worker behavior; it is not proof of every native
provider transport configuration. No TLS/security bypass or network-policy change.
An initial text-content readiness assertion failed because text was rasterized;
canvas readiness corrected the audit observation, not provider behavior.

Before the correction, 47 outbound request records included Iconify requests
separate from SimplePDF editor/CDN resources. Relevant SimplePDF observations:

| Endpoint / request | Observed category / field names |
| --- | --- |
| react-editor.simplepdf.com/en/editor GET | External iframe document, initiated on route entry before consent. |
| cdn.simplepdf.com scripts/styles/fonts/PDF.js worker | Provider asset downloads; these alone are not proof of file upload. |
| /trpc/public.getChangelog GET | Provider metadata, fields component and locale. |
| /trpc/public.recordEmbedOrigin POST, 40 bytes | Parent origin field. |
| /trpc/public.track POST, 141 bytes | Analytics fields type/name/data, pagesCount, hasInteractiveForm, isMobile, locale. |
| /trpc/public.document.resolveDocumentMetadata GET | Query field names documentFingerprint and prefillId; do not record their values. |

No request body in that bounded load contained the exact synthetic PDF binary or
its full base64 representation. This limited matching check does not establish
that no transformed/partial file information is sent, or that save/share never
uploads. The observed fingerprint query and analytics already require disclosure;
the old broad browser-only copy did not explain them.

## Verification separation

Deterministic CI/native regression tests intercept the provider origin with an
explicit controlled fixture. They verify the Orvulix gate, real iframe lifecycle,
synthetic file input, failure recovery, keyboard/mobile/dark, navigation/reload and
production/Pages metadata. They do not prove provider editing/export fidelity or
zero uploads. Unit tests isolate ToolContent layout, not the page adapter.
A separate live synthetic check after explicit opt-in loaded the same URL, accepted
the generated PDF and rendered a visible canvas (100x133). The frame was scrolled
into view before readiness; an earlier offscreen/hidden thumbnail selector was not
a provider failure. Do not infer this live result from controlled fixture tests.

SEO override and privacy copy describe the external integration before JavaScript
runs. Other tools/CDNs may still make their own requests; the consent gate controls
this editor and does not claim all Orvulix traffic stops.

## Follow-ups and sync hotspots

Owner: Orvulix maintainer. Before broad provider/privacy guarantees, audit save,
download/share, signature/form submission, account/company configurations,
analytics opt-out, retention and document transformations against current remote
code and policy. Acceptance: synthetic fixtures, stage-labelled network capture
with payload classification and data minimization, accurate UI/policy changes,
and regressions for any newly discovered automatic transmission. Never equate
absence of an observed raw-PDF body with a full no-upload guarantee.

Recheck the SDK/default embed URL and provider policy when syncing upstream.
Hotspots: small pdf/editor page adapter and its ToolInfo copy, seo/overrides.ts,
privacy paragraph in pages/information, focused CI command. Core/tests remain in
features/pdf-editor-consent. No tool service/locale/hosting migration. A true local
PDF editor or replacement provider is separate product/security work.
