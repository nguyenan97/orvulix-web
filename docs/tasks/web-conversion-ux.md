# Task checkpoint: web-conversion-ux

- Updated: 2026-10-14, Asia/Bangkok
- Branch / base: feature/web-conversion-ux / develop
- PR: https://github.com/nguyenan97/orvulix-web/pull/22
- Phase: CI
- Delivery mode: develop-merge
- Authorization: owner explicitly selected complete then merge develop in the
  resumed SDLC task. This supersedes the initial stop-at-PR delivery for PR22.
- Last verified feature SHA: e39356a57488c5f85bd3eef4d32e83d7571bd5c7
- Updated branch: merged develop 4802455 via 742dbd4; latest head must be read from
  Git/PR. Pending edits: curation scope guard, regression/theme assertions and
  this checkpoint. No production release or URL backend.

## Scope and acceptance

Remove local HTML tools from priority category CTAs, demote them in browsing/
related lists, preserve search and unrelated category behavior, explain file/
snippet input with experimental limitations, and document deferred URL-first
delivery. Keep existing renderer/security/export, SEO and Pages behavior.

## Completed and pending

Initial implementation and prior-head CI were green (1122 unit/91 Chromium,
six native cases across three engines plus Pages smoke). Resume review found
the generic fallback changed unrelated category CTAs; restrict it to curated
PDF/image categories and add a regression. Theme tests now assert actual app
background colors instead of relying only on media emulation.

Resume validation passed: typecheck; 1123 unit tests/124 files; 26 security tests
and audit gate; production 157 routes/sitemap/404; unchanged bounded list worker;
six Chromium/Firefox/WebKit cases with actual light/dark styles and PNG/PDF pixels;
158 Pages HTML files plus prefixed CTA/category/upload/PNG/noindex smoke.
Full-diff review found no remaining task-blocking finding after the scope guard.
Validation covers the reviewed working tree based on 742dbd4 plus the listed
pending files; resolve the committed head/CI separately, not from this snapshot.
Pending: scoped commit/push, latest-head CI, matched-head develop merge and cleanup.
Prior-head results are not claimed for these new edits. Retain unrelated user
public/sitemap.xml; checksum 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Resume point

Continue on the existing PR22 head; do not create a new PR/branch or implement URL
conversion. Inspect Git/PR/CI and reconcile checkpoint before acting. Local dev/Pages
servers were used for checks; stop only owned resources when finished.
