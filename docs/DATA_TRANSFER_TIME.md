# Data Transfer Time Calculator

## Execution prompt

Implement the next unimplemented backlog MVP, Data Transfer Time Calculator, in
the existing React/TypeScript SPA. Accept a data size, a transfer rate and an
optional efficiency percentage (default 100%). Explicitly distinguish bits/bytes
and decimal/binary units. Derive the current estimated duration immediately;
invalid or incomplete inputs must not retain a previous valid result. Validate
negative/non-finite values, zero rate, malformed numbers, unsupported units and
unrepresentable durations. No speed test, file reading, network request, storage,
new dependency or changes to shared calculators. Integrate search/English
metadata/SEO and accurate development roadmap status. Validate worked examples,
boundaries, keyboard/mobile browser interactions and Pages base/noindex. Review
the complete diff, pass exact-head CI, merge one PR into develop and safely delete
the completed branch. Production release is separate.

## Domain and UI contracts

- Route `/number/data-transfer-time`, isolated `src/features/data-transfer-time`.
  Pure arithmetic/validation owns the units and result; React owns form strings
  and derives the current output without effects or debounce. No worker is needed
  for three bounded numeric values and constant-time arithmetic.
- Duration in seconds = size in bits / (rate in bits per second * efficiency/100).
  One byte is 8 bits. Decimal k/M/G/T prefixes are powers of 1000; binary
  Ki/Mi/Gi/Ti are powers of 1024. Unit symbols retain case. Rate labels add `/s`.
  Units share constants only inside this feature, leaving inherited Byte Converter
  semantics unchanged. Both size and rate support bit and byte units.
- Numeric inputs accept ASCII decimal notation, surrounding whitespace, leading
  zeros and a decimal point, with at most 32 characters before trimming. No
  exponent, hex, comma grouping, units in the value or partial numeric suffixes.
  Size is 0..10^15, rate is >0..10^15 and efficiency is >0..100. Blank efficiency
  is equivalent to 100%; blank size/rate is incomplete. Optional does not mean 0%.
- Computation uses JavaScript Number, so results are estimates. Reject duration
  above Number.MAX_SAFE_INTEGER seconds rather than produce unreliable duration
  components. The formatted duration rounds up to the next whole second; positive
  sub-second durations explicitly read "Less than 1 s" and zero is "0 s".
  Decimal seconds/effective rate are shown to eight significant digits and labeled
  approximate. This does not model latency, retries, protocol behavior or changing
  bandwidth. Efficiency is user supplied and is not a measured network property.
- Error messages identify the field or result limit. Invalid input clears result
  immediately. Example: 1 GB at 100 Mb/s = 80 seconds, or 100 seconds at 80%.
  Example: 1 GiB at 100 MiB/s = 10.24 seconds (whole-second display: 11 s).
- Input/rendering is browser-local with React text sinks. No fetch, storage,
  clipboard, worker or external asset in this feature. App assets still load over
  the network. No dependency/license change or cross-feature API/ADR is required.

## Acceptance and evidence

| ID | Given/When/Then | Validation |
| --- | --- | --- |
| A1 | Decimal bytes at bit rate yield 80s; 80% efficiency yields 100s | Pure worked-example tests and native browser edits |
| A2 | Binary/decimal and bit/byte choices retain distinct conversions | Unit constants table tests, independent literal examples, browser unit choices |
| A3 | Empty/negative/zero-rate/malformed/oversized/non-finite/unknown-unit input has no result, then valid input recovers | Domain and DOM boundary tests, native invalid/recovery flow |
| A4 | Zero size, subsecond time, day boundaries and duration overflow have explicit behavior | Domain formatting and calculation tests |
| A5 | Current input always owns output; example/reset and keyboard/mobile work | DOM current-result tests and native browser/screenshot evidence |
| A6 | Registry/search, SEO and Pages prefix/noindex stay valid | Discovery tests, production build validators, Pages browser smoke |

## Research, maintenance and rollback

Reviewed 2026-10-19: upstream issue #80 is open. Current open PR titles do not
include a data-transfer estimator; this is an Orvulix MVP, not upstream approval.
Source: https://github.com/iib0011/omni-tools/issues/80 .
Inspected Byte Converter and generic calculator registry before choosing a small
independent feature: explicit efficiency, field errors and live result ownership
would otherwise change generic calculator contracts for unrelated tools.

Sync hotspots: number tool registry/meta, English number locale, SEO overrides,
roadmap and focused CI browser command. Rollback removes those entries and the
isolated module, with no persisted data migration. Larger numerical ranges,
file-size discovery, measured bandwidth and transfer scheduling are follow-ups,
owned by the Orvulix maintainer with separate scope and acceptance criteria.
