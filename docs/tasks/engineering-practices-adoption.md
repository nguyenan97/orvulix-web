# Task checkpoint: engineering-practices-adoption

- Updated: 2026-10-15 Asia/Bangkok
- Branch/base: feature/engineering-practices-adoption / develop 6fab3c3
- PR: not opened; delivery mode develop-merge, explicitly authorized
- Phase: validating; initial checkpoint prepared for draft PR
- Source: mattpocock/skills 49dd158d1076134a641b33efb035946536778336 (MIT)
- Preserve user untracked public/sitemap.xml, checksum
  5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3.

## Scope and evidence

Eight skill candidates and references researched; adoption matrix and local
conflicts in ENGINEERING_PRACTICES.md. One project-communication reference pointer, no new skill or
AGENTS expansion; MIT notice retained. No authority/merge-gate changes.
Pilot replaces two duplicated test-only GIF inspectors with one helper and a
literal delta-frame contract test. Existing browser assertions/encoder behavior
unchanged. No application code/dependencies/hosting/locales or next backlog task.

Missing-module red test is scaffolding, not product-bug reproduction. Two new
contract tests green before migrating callers. Full unit suite: 134 files / 1208
tests passed. Production build: typecheck, 157 indexable routes/sitemap and 404
validation passed. Security: 26 tests passed; check accepted the existing 15
package findings / 6 advisory IDs with no unaccepted high/critical findings.
Native browsers: 66 cases running with retries disabled. Final full-diff review,
PR/exact-head CI/merge/cleanup pending.

Manual bug/refactor/review-only/resume instruction walkthroughs passed; skill
frontmatter and new documentation local references resolve. No runtime, asset or
routing changes, so no additional local Pages smoke is needed; existing Pages CI
remains required. Initial build caught a new fixture type mismatch (GifWriter
requires number[]); corrected before the passing build, without weakening tests.
No owned dev server; native test preview 4173 is managed by Playwright.

## Resume

Resolve actual Git/PR state first. Finish native/full tests, review all assertions
and document links/authority/scenario walkthroughs. Commit/push this feature only,
one PR into develop. Follow exact-head CI including flaky summary and CodeQL;
fetch develop, revalidate changes, matched-head merge when all gates pass, then
verify and cleanup only this task branch. Main/production remain out of scope.
