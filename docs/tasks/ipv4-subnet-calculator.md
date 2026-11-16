# Task checkpoint: ipv4-subnet-calculator

- Updated: 2026-10-19 Asia/Bangkok
- Branch/base: feature/ipv4-subnet-calculator / develop b22ab65a
- PR: not opened
- Phase: reviewed / preparing draft PR
- Delivery mode: develop-merge
- Authorization: user requests prompt and execution; feature selection delegated.
- Base clean and fast-forwarded; new feature files are uncommitted.

## Scope and acceptance

[Prompt and contracts](../IPV4_SUBNET.md) own A1-A6 and limitations. Risk: bounded
numeric parser/UI. No dependency/network/storage/worker changes. Existing
SCA/SAST/secrets gates apply; auth/container/renderer/codec controls are N/A.
One focused browser spec will be added to the existing calculator CI command.

## Discovery/design

PR57 merged, no open task PR, develop up to date. No subnet calculator in current
code. Upstream #231 open; no matching current PR title. Official RFC4632 and
RFC3021 read. Dedicated pure IPv4 arithmetic and derived React output selected;
CIDR explicitly disables the manual mask. No IPv6 or host enumeration.

## Validation/review

Implemented isolated parser/arithmetic/live React UI, thin number registry/route,
English metadata/SEO, search and roadmap status. No shared calculator or runtime
dependency changes. Result is synchronous and derived from current form values.

TDD slice: conventional /24 passed; /31 initially gave zero host slots and a
directed broadcast, then passed after introducing explicit point-to-point/single
host semantics. Expanded suite: 5 focused files / 106 tests passed, including all
33 literal mask/prefix pairs, unsigned /0,/1,/31,/32, malformed and oversized input,
CIDR/manual ownership and current-result recovery. Read-only full ESLint passed.
Audit gate passed with unchanged 15 package findings / 6 advisories and the exact
existing temporary exception; 26 security tests passed. Live develop rules still
require build/secret-scan/dependency-audit/codeql, resolved threads and 0 approving
reviews. No protections/scanners/exceptions changed.

Production build passed: TypeScript, 162 indexable routes and sitemap/404
validators. Full suite passed 183 files / 1862 tests with original configuration.
Production native browser run passed 9/9 on Chromium/Firefox/WebKit, retries=0,
covering mask/CIDR ownership, /0,/31,/32, invalid/recovery/reset, keyboard and
390px overflow. Calculator mobile screenshot visually inspected; labels, address
ranges, integer counts and notes wrap without horizontal clipping. Text style
including newly staged files and staged whitespace checks passed.

Two-axis self-review against base b22ab65a (refetched unchanged):
- Requirements: A1-A6 traced to literal vectors, 33 independent mask fixtures,
  bounded invalid input, current-result DOM tests and actual browser flows.
  Special-prefix semantics and mathematical capacity limits are explicit.
- Standards/security: prefix/octet grammar bounded before trim/split/regex,
  no signed bitwise math, no host enumeration, React text sinks only, no network,
  file, persistence, worker or dependency. CIDR/manual ownership is visible;
  derived output has no effects/debounce. Labels, errors and stable row keys
  checked. Retain React18/MUI; Next/SSR/migration suggestions do not apply.
No task-blocking finding identified. Self-review is not independent approval.
Pages build passed: 163 dev HTML files validated under /orvulix-web/. Prefixed
native smoke also passed 9/9 across Chromium/Firefox/WebKit with retries=0 and
noindex assertion. No compiler/native failure in this task's local delivery
checks. Dev/build/unit and browser-owned previews have stopped.

## Resume point

Local validation complete. Commit scoped files/checkpoint and open one draft PR
into develop. Mark ready after post-hook/remote diff check; record exact PR/head
and CI evidence in PR metadata. Inspect CodeQL findings and latest base before
matched-head merge, then verify merge head/ancestry and safely delete only the
completed task branch. Production release remains outside scope.
