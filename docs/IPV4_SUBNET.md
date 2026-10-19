# IPv4 Subnet Calculator

## Execution prompt

Implement the next unimplemented backlog MVP, IPv4 Subnet Calculator, in the
existing React/TypeScript SPA. Accept IPv4/CIDR or an IPv4 address plus prefix or
contiguous dotted subnet mask. Show normalized address/CIDR, network, subnet mask,
wildcard, last address, directed broadcast, host range and address/host counts.
Define /0, /31 and /32 explicitly. Reject malformed octets/prefixes/masks and clear
previous output immediately when input becomes invalid or incomplete. No IPv6,
DNS, network probes, host enumeration, persistence, new dependencies or changes
to inherited calculators. Integrate search, English metadata, SEO and accurate
roadmap status. Validate literal examples, all prefixes/masks, unsigned address
boundaries, current-input UI, browser keyboard/mobile behavior and Pages
prefix/noindex. Review the complete diff and pass exact-head CI, then merge the
single task PR into develop and safely clean up its branch. Production is separate.

## Contracts and design

- Route `/number/ipv4-subnet-calculator`; isolated feature-local parser/arithmetic
  and React form. Result derives synchronously from two bounded strings. No worker
  or generic calculator framework changes are necessary.
- Address field accepts dotted decimal or dotted decimal plus `/0` through `/32`.
  Without CIDR, a separate field accepts `24`, `/24` or `255.255.255.0`. When CIDR
  is present, its suffix controls the calculation and the separate field is
  visibly disabled, showing that suffix. Removing CIDR restores the manual value
  (initial `/24`). This avoids silently combining conflicting prefixes.
- Trim only whole-field surrounding whitespace. Four ASCII decimal octets,
  0..255, no leading zeros except `0`, no hex/octal/exponent/abbreviations/internal
  whitespace. Prefix is canonical decimal 0..32, no sign or leading zeros. A CIDR
  suffix must be a prefix, not a dotted mask. Both raw fields are limited to 64
  characters before trim; the inactive manual field is ignored for CIDR input.
- Dotted masks must have contiguous high one bits followed by low zero bits.
  `0.0.0.0` and `255.255.255.255` are valid. Wildcard is the 32-bit mask inverse.
  Integer arithmetic stays within 0..2^32; avoid signed JavaScript bitwise results.
  Compute block boundaries and counts, never enumerate hosts even for /0.
- For /0../30, directed broadcast is the last address; conventional host range
  excludes network and broadcast, host count = total minus two. /0 therefore
  produces 4,294,967,296 total addresses and 4,294,967,294 mathematical host slots.
- /31 uses RFC 3021 point-to-point semantics: two endpoint addresses, both usable
  under that link convention, no directed broadcast. /32 is one host route with
  one address and no distinct directed broadcast. UI states these semantics and
  does not imply /31 is applicable to every interface or network.
- Counts are mathematical subnet capacity, not assignability. Special-use,
  reserved, multicast and loopback addresses are not filtered. No claim that
  addresses are routable, unallocated or permitted by cloud/provider policy.
- Output is React-rendered text only. No fetch, DNS, storage, clipboard or file
  sink in this feature. App assets can still load over the network. No dependency
  or cross-feature API change, so no new ADR/migration is needed.

## Acceptance and evidence

| ID | Given/When/Then | Evidence |
| --- | --- | --- |
| A1 | 192.168.1.130/24 yields .0 network, .255 broadcast, .1-.254 hosts and 254 slots | Literal domain, DOM and native browser cases |
| A2 | Prefix and equivalent dotted masks agree for all 33 prefixes; masks reject holes | Literal mask table and independent boundary examples |
| A3 | /0, /31 and /32 have documented counts/ranges without signed overflow | Pure literal fixtures and native /0,/31,/32 flows |
| A4 | Invalid/incomplete or oversized input clears output, valid input recovers | Parser/DOM and native invalid/recovery/reset cases |
| A5 | CIDR suffix controls the visibly inactive mask field; manual mode recovers its value | DOM/native editing and keyboard/mobile screenshots |
| A6 | Tool search, SEO and Pages prefix/noindex remain valid | Registry tests, production build and Pages smoke |

## Research, maintenance and rollback

Reviewed 2026-10-19: upstream issue [#231](https://github.com/iib0011/omni-tools/issues/231)
is open and requests IPv4/IPv6. Current open PR titles do not identify a subnet
calculator. Repository code search found no existing implementation. This delivers
only the backlog's IPv4 MVP, not upstream acceptance or IPv6.

Primary references read for prefix and /31 semantics:
- [RFC 4632 section 3.1](https://www.rfc-editor.org/rfc/rfc4632.html#section-3.1).
- [RFC 3021 section 2](https://datatracker.ietf.org/doc/html/rfc3021#section-2).
The RFC Editor request for RFC3021 returned 429; the official IETF mirror was read.

Sync hotspots: number registry/meta, English number locale, SEO overrides,
roadmap and focused browser CI command. Rollback removes those entries and the
isolated module. No saved data migration. IPv6, special-use classification and
provider-specific allocation rules require separate scope and fixtures; owner:
Orvulix maintainer.
