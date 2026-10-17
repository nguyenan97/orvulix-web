# JSON and text-import admission limits

Task: [foundation checkpoint](tasks/json-foundation-hardening.md). PR metadata
records delivery to develop; this is separate from a production release.

## User behavior

Prettify, Minify and Sort reject excessive documents with an inline actionable
error, empty output and disabled Copy/Download. Smaller valid input recovers.
Sort derives validity from the current Formik mode/key/order; clearing input
removes its previous output/error. Errors are never JSON output. Existing services
retain native numeric/duplicate-key/formatting semantics for admitted documents.
Sort retains shallow sorting and own prototype-named keys.

| Boundary | Limit and enforcement |
| --- | --- |
| JSON source | 262,144 UTF-16 code units before parsing or Sort header discovery. These are JS string units, not UTF-8 bytes or Unicode code points. |
| JSON nesting | 64 object/array levels before parsing. Quoted/escaped content is ignored. |
| JSON lexical values/keys | 20,000 starts of containers, strings (including keys), or primitive tokens across the whole JSON/JSONL document. An admission budget, not syntax validation or a per-row allowance. |
| JSON output | 2,097,152 UTF-16 units before publication to the editor or export actions. No silent truncation. |
| Shared text/code file selection | 1,048,576 bytes (1 MiB) before constructing FileReader; decoded text must also be at most 1,048,576 UTF-16 units before onChange. Exact limits are allowed. |

An oversized replacement file cancels the previous pending reader, reports a
generic error without file details and preserves the current editor value. Its
existing result remains valid if that source has not changed. Same-file retry,
empty files, Unicode and native readAsText decoding remain supported. JSON
admission also applies to typed/pasted text, examples and imported files. File
admission alone does not bound arbitrary pasted input in other tools.

## Resource model and verification

The lexical scan uses constant auxiliary space and stops at the first exceeded
limit. Parsing, sorting, stringification, header extraction and editor work remain
synchronous. Input length, nesting and token count bound the serializer's temporary
work, but the output check runs after serialization: it is not a hard heap quota,
preemptive cancellation or a strict CPU deadline. These conservative limits
intentionally reduce accepted document size; they do not promise fixed latency on
all devices. Worker isolation is separate if larger documents are required.
Actual measurements and environment are recorded in the task checkpoint.

Tests cover exact/one-over boundaries, quoted delimiters/escapes/Unicode, JSONL
whole-document token counts, rejection before JSON.parse, expanded output and
recovery. Component regressions use real pages/Formik/services and stub Monaco;
file tests control callbacks to prove no reader startup above the byte cap and no
late overwrite. Browser flows use real Monaco, FileReader, options and downloaded
bytes. See checkpoint/PR for actual engine outcomes, failed runs and CI evidence.

Sync hotspots: the three result evaluators, Sort source/header inspection,
SortResult/page adapter, shared file-import hook and existing browser suites.
Do not apply these tool-specific budgets to all inherited parsers implicitly.

Owner: Orvulix maintainers. Follow-ups: workers for larger inputs, other consumers,
pending clipboard notification ownership and Sort primitive-row/missing-key/
collation semantics.
