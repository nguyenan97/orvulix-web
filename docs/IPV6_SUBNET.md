# IPv6 Subnet Calculator

## Execution prompt

Implement a standalone IPv6 Subnet Calculator in the existing React/TypeScript
SPA at /number/ipv6-subnet-calculator. Accept full/compressed IPv6, including a
strict dotted IPv4 tail, with an optional CIDR suffix or separate prefix 0-128.
Normalize hexadecimal output, show expanded input, network CIDR, first/last
address and exact decimal address count. Use bounded 128-bit BigInt arithmetic;
never enumerate addresses. No broadcast or usable-host deduction in IPv6. Clear
results immediately on invalid/incomplete input and restore the manual prefix
after removing CIDR. Add example/reset, accessible labels/current status and
mobile wrapping. Keep IPv4 and shared calculators unchanged. No network probes,
persistence, dependencies or backend. Integrate discovery, English metadata, SEO,
roadmap and focused browser CI. Validate domain/UI/native browsers and Pages
prefix/noindex, review the full diff, pass exact-head CI, merge one PR into develop
and safely clean up its branch. Production release is separate.

## Contracts and decisions

- Pure feature-local model -> React form -> existing lazy number registry. No
  shared calculator extraction or new ADR needed; no cross-feature API changes.
- Both raw fields max 80 characters before trimming. Trim surrounding whitespace
  only. IPv6 groups contain 1-4 ASCII hex digits; uppercase and leading zeros are
  accepted. At most one :: replacing at least one group; otherwise eight groups.
  A dotted tail is exactly four decimal octets 0-255 without leading zeros and
  occupies the last two groups. Plain IPv4 is rejected. No zones (%eth0), brackets,
  ports, URLs or internal whitespace. Those are endpoint syntax, not subnet input.
- Prefix is canonical ASCII decimal 0-128, optionally / in the manual field.
  CIDR must have one numeric suffix; it controls and disables the manual field.
  The previous manual value (initial /64) is restored on removing the suffix.
- Output uses lowercase hexadecimal, no leading group zeros, longest zero run
  compressed only if length >=2, leftmost run on ties (RFC5952 section4 rules).
  Dotted tails are normalized to hex too, explicitly documented rather than
  claiming RFC5952 section5 mixed-address presentation for every address family.
- total=2^(128-prefix), first=network floor, last=first+total-1 using BigInt.
  /0 contains 340282366920938463463374607431768211456 addresses; /128 one.
  Counts mean mathematical capacity, not usable hosts, allocation, routability,
  SLAAC compatibility or special-use classification. No address is subtracted.
- Input -> bounded parser/BigInt -> React text. No HTML, URLs, fetch, storage,
  worker, clipboard or file sink. Constant bounded work for /0. Existing app
  assets may still load, including existing Iconify icon requests observed in
  native browsers. Calculation works offline after app load; this is not an
  offline-install or zero-network app claim. Auth/container/backend controls N/A; existing audit,
  secret scan and CodeQL still apply, no exception changes.

## Acceptance

| ID | Given/When/Then | Evidence |
| --- | --- | --- |
| A1 | 2001:DB8:abcd:1234::1/64 gives 2001:db8:abcd:1234::/64 and exact 18446744073709551616 addresses | Literal domain/DOM/native |
| A2 | Expanded/compressed/IPv4-tail input normalizes consistently, leftmost longest zero run wins | Literal fixtures, Node net.isIP comparison for input validity |
| A3 | /0, non-hextet prefixes, /127, /128 preserve exact boundaries without enumeration or broadcast deduction | Literal fixtures and native /0,/127,/128 |
| A4 | Invalid/oversized/incomplete input removes results immediately; valid recovery and Reset work | Model/DOM/native |
| A5 | CIDR owns prefix visibly, removal restores manual value; keyboard/mobile controls usable | DOM/native screenshot |
| A6 | Discovery, metadata, production build and Pages prefix/noindex work | Registry, SEO/build validators and native prefix smoke |

## Research and maintenance

Reviewed 2026-10-20: upstream issue231 remains open, requests IPv4/IPv6. Orvulix
PR58 supplied IPv4 only. This adds a separate IPv6 tool, not upstream acceptance.
References: [RFC4291 sections2.2/2.3](https://www.rfc-editor.org/rfc/rfc4291) for
syntax/prefixes and absence of broadcast, [RFC5952 section4](https://www.rfc-editor.org/rfc/rfc5952)
for hexadecimal formatting. No source code copied from the RFCs.

Sync hotspots: number registry/meta, English number locale, SEO overrides,
roadmap and browser CI list. Rollback removes those entries and the isolated
module; no data migration. Owner Orvulix maintainer: subnet splitting, zones,
special-use and assignment/provider policies remain separate scoped features.
