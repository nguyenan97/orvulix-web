# Web conversion deferred work

Decision snapshot: October 13, 2026. Local conversion is implemented on
feature/html-to-image in PR20, not merged. This register describes future work,
not features available in the product. No completion-time or hosting-cost
estimates have been measured. See [current contracts](WEB_CONVERSION_PLAN.md).

## Current delivery boundary

Local MVP: static HTML to PNG/JPEG and raster PDF, embedded PNG/JPEG, One page /
Paginated, ranges, repeated supported thead headers, explicit preview/conversion,
validated option presets, cancellation and resource bounds. PDF text remains
non-searchable/non-selectable. Presets store no input, fonts, assets or results;
there is no settings persistence. Production and Pages policies are unchanged.

| Order | Item | Status | Reopen when |
| --- | --- | --- | --- |
| 1 | Local uploaded fonts | Deferred | A bounded validator/embedding spike passes all three engines |
| 2 | Remote gateway/renderer platform | Blocked | Hosting/funding and service operation are explicitly authorized |
| 3 | URL to Image | Deferred | Platform security/ownership/cancellation gate passes |
| 4 | URL to native searchable PDF | Deferred | Platform plus native PDF fidelity gate passes |
| 5 | Remote readiness/lazy/fixed/cookie controls | Deferred | Relevant output tool is stable and each heuristic is bounded/tested |
| 6 | Batch/scheduled/authenticated capture | Blocked | Ownership, secret handling, quotas and retention are designed and authorized |
| 7 | Complex local layouts/assets and oversized-block splitting | Deferred | A bounded fidelity/security spike passes before changing local contracts |

## 1. Local uploaded fonts

Value: invoices/templates can retain their intended typography. This is feasible
without a backend, but the current implementation deliberately supports system
fonts only. Evidence: sanitize.ts restricts font-family and emits font-src 'none';
renderer.ts and paginated-renderer.ts use skipFonts: true. A FontFace loaded in
the parent would not automatically establish the same font in controlled frames
or html-to-image's SVG clone. No uploaded-font compatibility spike has passed;
this is a missing asset pipeline, not evidence that browsers cannot load fonts.

Prerequisites: review official format/decoder guidance and advisories; choose a
maintained validator or a bounded implementation with license/bundle review.
Do not accept extension/MIME alone. Validate container/table bounds, declared
expanded sizes and descriptors; reject unsupported collections, SVG glyphs or
external references rather than pretending they are safe. Compressed-size caps
alone do not bound decompression or native decoder allocations.

Proposed first scope, subject to validation: one local WOFF2 regular face,
256 KiB compressed and 1 MiB declared expanded size; generated family name and
fixed supported descriptors. These are proposed gates, not implemented limits.
Core stays in this feature module as a separate typed font-asset adapter. Use a
narrow reviewed data-font CSP, immutable font snapshots, readiness deadlines and
explicit measurement/preview/clone embedding. No external font URL input or
arbitrary user CSS; keep the app's Quicksand separate from document fonts.

Acceptance/tests: valid deterministic licensed fixture and malformed/truncated/
oversized/compressed-bomb headers; real PNG/JPEG/PDF proving the uploaded font
changed output; measurement and clone wrapping/column widths match; font edits
invalidate full pagination before ranges. Cover missing glyphs, decoder failure,
timeout/cancel/unmount and late completion on Chromium/Firefox/WebKit. No silent
fallback. Cleanup FontFace registrations/buffers/URLs on every exit; no hard native
CPU/memory quota claim. Font changes must keep input/image/page/output budgets.

Reopen after that spike passes, with a documented supported format/capability
matrix. Depends only on local asset/security work, not on remote funding. Native
font parsing/clone embedding and multiple preview frames have memory/CPU costs;
measure them before accepting the proposed budgets.

## 2. Remote platform

Value: enables real arbitrary-public-URL rendering. Blocked under the currently
authorized local-only/no-backend budget. A GitHub Pages SPA cannot access arbitrary
cross-origin rendered DOM; CORS fetch does not create a browser screenshot.
Open-source Playwright/Gotenberg still requires hosting, CPU/RAM and operations.

Prerequisites: explicit hosting/funding authorization, service owner, deployment
and patching strategy, authentication/quotas and a privacy/retention policy.
Architecture: existing SPA -> authenticated bounded gateway -> private pinned
renderer -> owned bounded result/download. Keep contracts/client adapters in the
feature module and the remote service separately deployed; do not migrate the
SPA, add SSR or change Netlify production settings to experiment.

Mandatory platform gate:

- Reject unsafe protocols/embedded credentials; apply policy to initial URL,
  redirects and every subresource. Cover IPv4/IPv6, loopback/private/link-local,
  cloud metadata and DNS rebinding. Bind outbound connections to validated DNS/IP
  and enforce egress restrictions; flags alone are not SSRF proof.
- Isolated fresh browser contexts/processes in non-root sandboxed containers,
  without host network, mounted host secrets or raw DevTools/Gotenberg access.
- Job/result ownership, bounded request/options, concurrency/queue/CPU/RAM/time
  quotas and rate limiting. Backend cancellation must stop rendering, not merely
  hide frontend output. Kill/reap processes on timeout/cancel/crash.
- Bounded downloads/storage, expiry and deletion of temporary artifacts; no user
  content or credentials in logs/telemetry. Restrict CORS without treating it as
  authentication. No forwarding user cookies/credentials by default.

Acceptance/tests: real gateway and pinned renderer, controlled public/private/
redirect/DNS/subresource fixtures, process crashes, quota saturation, ownership
violations, cancel/timeout termination, bounded output/download and TTL cleanup.
Record measured startup/latency/memory/bandwidth before choosing numeric quotas
or recommending a host. Reopen only after the security and operational gate;
no price estimate or paid provider selection is authorized here.

## 3. URL to Image

Value: screenshot a public webpage as PNG/JPEG. Deferred until platform gate 2.
A local public proxy or no-cors request cannot replace a safe renderer. Planned
client adapter uses explicit URL/options/job/progress/result contracts, separate
from the local HTML engine; user must understand the URL goes to the service.

Acceptance: controlled static and SPA fixtures, viewport/scale, fonts/images,
PNG/JPEG decoded dimensions/pixels, explicit bounded viewport/full-page capability,
unsupported/login/TLS/403/unreachable responses, downloads/cancel/recovery and
network isolation. No silent truncation of full-page capture. Full-flow tests use
real backend browser execution and bounded downloads, not only mocked APIs.

Reopen after platform gate plus measured image canvas/output limits. Depends on
2; remote readiness options initially use fixed safe defaults. Full-page geometry,
image encoding, concurrency and bandwidth need measured budgets before release.

## 4. URL to searchable PDF

Value: selectable/searchable text and native print layout rather than the current
raster PDF. Deferred until 2 and a native browser-PDF fidelity spike. Browser print
in the user's local tab is not a reliable programmatic file download from an
arbitrary URL. It can be described separately without implying service parity.

Plan: private pinned Chromium PDF adapter with typed A4/Letter/orientation/margins,
print/screen policy and validated native page ranges. Keep a distinct output label
from local raster PDFs; no claim of PDF/UA or PDF/A compliance without validation.

Acceptance: extract expected Unicode text from actual PDFs, inspect page count /
MediaBox /placement/resources and rasterize for visual checks. Cover pagination,
tables, fonts, print CSS, whitespace, unsupported/auth pages, output caps, cancel
and recovery with real gateway/renderer flow. Block unsafe downloads/actions and
review engine output policy instead of importing arbitrary remote PDF resources.

Reopen after platform, native-text/fidelity tests and privacy/output review.
Depends on 2; URL-to-Image 3 can supply shared readiness/ownership tests. Measure
font/browser memory, document growth and encoding costs before setting quotas.

## 5. Advanced remote controls

Value: useful captures of pages with lazy content, fixed elements or consent
banners. Deferred; user HTML scripts/navigation are intentionally blocked locally.
These are separate optional heuristics, not universal guarantees.

Plan each control independently: bounded delay/readiness, bounded scroll steps /
document extent for lazy loading, explicit fixed-position rewrite policy and
opt-in cookie-banner handling. Use trusted limited renderer logic; never accept
arbitrary scripts, bypass login/CAPTCHA or import browser cookies automatically.
Show capabilities/warnings instead of ignoring an unsupported control.

Acceptance per control: controlled fixtures for polling SPAs, infinite scroll,
missing fonts/images, nested sticky elements, banners that are/are not recognized;
verify content order, no lost sections, bounded work, safe subresource traffic and
actual outputs. Readiness has a deadline and bounded predicates, never endless
networkidle. Reopen only after 3/4 are stable and the individual heuristic passes.
Additional work increases renderer time/memory; measure it against existing quotas
instead of extending deadlines to mask failures.

## 6. Batch, scheduling and authenticated capture

Value: repeated or private-site workflows. Blocked on platform/operations and
explicit credential-handling authorization; this is not an extension of local
preset storage. User input/credentials are never sent to another service by default.

Plan: owned bounded jobs with idempotency, concurrency/queue quotas, cancellation,
retention/TTL, bounded result bundles and per-job audit events without content.
Authenticated capture additionally needs consent, secret isolation, encryption /
rotation/access policy and clear exclusions for bypassing access controls.
Scheduled jobs require an approved hosting/operating budget and durable job state.

Acceptance: tenant/job isolation, unauthorized download/cancel, duplicate/retry
semantics, scheduler overlap, secret redaction, revocation, timeout/process cleanup,
expiry and bounded bundles. Real service tests cover recovery without unbounded
retries. Reopen after 2-4 and explicit ownership/credential/retention review.
Measure storage, queue, browser concurrency and operating cost before approval;
no implementation or cost commitment is made by this register.

## 7. Complex local layouts and additional assets

Value: wider HTML compatibility. Deferred, not blocked on funding. Current local
contracts intentionally reject or warn on unsupported fonts/CSS/assets, overflowing
geometry, oversized atomic blocks and repeated-header rowspan/nested/flex layouts.
The renderer is a DOM serializer, not a native screenshot engine; native body
measurement alone is not proof that its clone has equivalent geometry/pixels.

Prerequisites: choose one narrow capability (for example an explicit oversized-row
split policy) and reproduce the limitation with deterministic fixtures. SVG/ZIP /
external-asset input additionally requires a reviewed asset validation/isolation
policy before expanding CSP or sanitizer allowlists. Do not turn broad sanitizer
allowances into a fidelity promise or use network proxies for local HTML assets.

Plan: a separate typed capability/adapter within this feature module, existing
sanitizer and owned frame lifecycle. New break/split behavior must be explicit,
never silent. Source/output quotas and Page ranges/repeated-header contracts apply
before rendering; no full-document canvas or unsafe renderer fallback.

Acceptance: actual output pixels/content order for the chosen layout, no omitted /
duplicated seams, compatible preview/export and clear reject/warnings outside the
subset. Test malicious/malformed/oversized assets, clone network/script isolation,
all three engines, cancel/unmount/deadline and recovery. Reopen after that isolated
spike meets the existing budgets; measure allocation growth before proposing new
limits. Depends on local reliability/asset work, and on font item 1 if typography
is part of the chosen scope. This register does not authorize broader formats.

## Sync and delivery

Each reopened item gets one concrete scope and acceptance gate in its PR, follows
AGENTS.md and targets develop. Update this register only from verified evidence.
Keep planned/deferred/blocked distinct from implemented-on-branch and merged.
Do not mark the whole Web conversion feature complete while remote items remain.
