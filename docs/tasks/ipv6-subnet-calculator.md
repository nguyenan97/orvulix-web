# Task checkpoint: ipv6-subnet-calculator

- Updated: 2026-10-20 Asia/Bangkok
- Branch/base: feature/ipv6-subnet-calculator / develop 3adade95
- PR: not opened
- Phase: reviewed, ready for commit/PR and exact-head CI
- Delivery mode: develop-merge
- Authorization: user requested prompt and execution, feature choice delegated.
- Verified clean fast-forwarded develop, no open PRs. Current edits uncommitted.

## Scope and acceptance

[Execution prompt/contracts/A1-A6](../IPV6_SUBNET.md). Standalone bounded IPv6
arithmetic and current-input UI. No shared IPv4 behavior changes or dependencies.
Risk: bounded parser and precision; input -> 128-bit BigInt -> React text. No
network/persistence/active sink. Applicable security controls and limits in spec.

## Completed and pending

Inspected existing IPv4 model/UI/registry/SEO/CI and upstream issue231 (open).
Read RFC4291/RFC5952 for syntax, prefix and formatting; no broadcast in IPv6.
Implemented pure 128-bit parser/arithmetic, current-input React form, lazy route,
English metadata/search/SEO, roadmap and focused Chromium CI list. No dependency
or IPv4/shared calculator changes. Vertical /64 test failed on the initial
incomplete stub then passed on implementation; that proves new feature behavior,
not a reproduced existing bug. Corrected one test fixture that wrongly called
plain IPv4 malformed according to Node; plain IPv4 rejection retains its own test.

Full read-only lint passed; focused native spec lint passed after dialog/error
assertions. Full unit run initially rejected SEO description at 156 characters;
shortened it without changing the validator. Latest isolated full run: 185 files,
1928 tests passed (including newline, all prefixes, precision and DOM ownership).
Audit passed with existing 15 package findings/6 advisory IDs and exact exception
unchanged; security tests 26/26 passed. Live develop rules still require build,
secret-scan, dependency-audit/codeql and resolved threads, zero approving reviews.
Dev server ran and returned route HTTP200, then stopped. Production build passed
TypeScript, 163 indexable routes/141 tools, sitemap and 404 validation.

First native run: 15 passed, three versions of the same incorrect zero-external-
request assertion failed on existing Iconify asset downloads. Corrected the test
to match the pre-existing contract (app assets may load): narrow exact origin,
GET/no body, collection paths and known icon-name allowlist; unknown external
requests still fail. Added a separate real browser offline calculation/recovery
flow after application load. No runtime change or application asset restriction
was needed. No deadlines/retries or calculator assertions relaxed.

Latest production native run: IPv6 plus existing IPv4 specs, 21/21 passed on
Chromium/Firefox/WebKit, workers=1, retries=0 (37.1s). Pages build validated 164
dev HTML files under /orvulix-web/. Latest Pages native run: IPv6 spec 12/12
passed on three engines, workers=1, retries=0 (25.2s), prefix/noindex preserved.
Mobile screenshot changed from full page to viewport for readable inspection;
Pages rerun covers that test-only change. Screenshot inspected at width390:
range/count wrap, no horizontal overflow; Reset keyboard behavior passed.

Requirements and Standards self-review complete against A1-A6: exact bounded
arithmetic, parser syntax, current-output/error ownership, CIDR/manual state,
discovery/SEO, mobile/accessibility, resource/network/sink and CI boundaries.
No task-blocking finding remains. Tests mock no calculation or DNS/HTTP API;
Node net.isIP checks address syntax only, literal fixtures independently check
boundaries/counts. No broad compliance or independent approval claimed. Existing
CodeQL dispositions require exact-head comparison. Local evidence applies to the
uncommitted tree over 3adade95; resolve committed head through Git/PR on resume.

Commands: npx vitest run; npm run lint:check; npm run build;
npm run security:audit; npm run security:test. Native: existing production build,
IPv6 and IPv4 specs with --workers=1 --retries=0. Pages:
PAGES_BASE_PATH=/orvulix-web/ node scripts/pages/build.mjs; IPv6 spec with
PLAYWRIGHT_BASE_PATH=/orvulix-web using ignored ipv6-pages.config.ts serving
pages-dist on4174 with matching base. Actual shell environment syntax: PowerShell.

## Resume point

Stage task files, text-style/cached-diff checks, commit/push one draft PR into
develop and mark ready after verifying remote head/base/files. Exact-head
CI/rules/base/review checks precede
matched-head merge and verified cleanup. Resolve latest PR/CI status from GitHub,
not this pre-PR checkpoint. No production release. All task-owned servers stopped.
