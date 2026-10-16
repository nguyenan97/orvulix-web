# JSON Sort own-key preservation

Scope: key sorting at `/json/sort`, implemented on this task branch. The task
checkpoint and PR record delivery status; production release remains separate.

## Observed defect and correction

JSON.parse treats a literal `__proto__` property as own JSON data. The inherited
sortObject then assigned sorted values into `{}`. Assignment to `__proto__`
invoked the inherited setter: object/null values could replace that temporary
result's prototype, while other values were ignored. JSON.stringify consequently
omitted the key from exported data. This is confirmed data loss, not evidence of
polluting global Object.prototype or a complete prototype-pollution audit.

Object.fromEntries now constructs own data properties from the same sorted keys.
This preserves literal `__proto__` values without invoking the inherited setter.
The runtime change is confined to sortObject construction in the inherited service;
an additional runtime abstraction would add indirection without another caller.
No dependency, parser, UI/options, locale, route or hosting changes are needed.

The existing shallow contract remains: one object or each top-level array/NDJSON
row is sorted; nested values are retained without recursive sorting. JSON and
JSONL formatting/extensions, row order in key mode, value-mode sorting, ordinary
key direction, integer-index enumeration, native duplicate-key/numeric precision
and errors are unchanged. This is not lossless numeric parsing, recursive sorting
or validation of every possible array element shape.

## Validation

Eleven real-service tests characterize preservation and existing behavior. Eight
regressions fail before the fix: six `__proto__` value types, array rows and JSONL.
They use literal JSON fixtures (object literal __proto__ syntax would change a
fixture's prototype). Assertions verify own-property presence, complete values,
shallow nested ordering, key direction, compact JSONL and native integer ordering.
Three existing-behavior characterizations cover ordinary ordering, value mode,
errors, Unicode/literal escapes and native number/duplicate-key semantics.

Native browser flows use the actual pinned Monaco renderer, options/examples,
file upload, clipboard, keyboard and downloaded bytes. They verify ascending and
descending objects, prototype-named keys, nested content, JSONL row preservation
and transition to JSON arrays/extensions, including mobile/dark layout. Node
parsing of actual downloads verifies own keys, not just a filename or mocked call.
The same focused flows run under the Pages repository prefix. Local/CI outcomes
and the exact head are recorded by the task checkpoint/PR, not inferred here.

## Limits and follow-ups

Owner: Orvulix maintainers. JSON Sort still has the separately observed inherited
empty-input stale-output and exportable-error behavior. A later lifecycle task must
reproduce it through the page, define source/options/output/action ownership and
retain supported JSON/JSONL sorting with component and native recovery tests.
This construction fix does not resolve that issue. Shape handling (null/primitive
rows), missing-key policy and Unicode collation require separate contracts before
changing behavior. Parsing/sorting/stringification remain synchronous whole-input
operations, without a hard CPU/memory cap or worker isolation.

Upstream sync hotspot: retain own-data-property construction in sortObject when
syncing its service. Keep real-service tests in src/features/json-sort and native
regressions in the existing code-result browser spec. Public roadmap data is shared
between React/static prerender and records only verified prior development delivery.
