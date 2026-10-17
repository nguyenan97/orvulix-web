# Text Workflow Builder MVP

Route: `/string/text-workflow`. Implementation lives in
`src/features/text-workflow`; page/meta/string registry are thin adapters.
Delivery/check evidence: [task checkpoint](tasks/text-workflow-builder.md) and
the linked PR's current state. Implementation on a feature branch is not a
production release or evidence of upstream acceptance.

## Behavior

Add transformations, edit options, move steps with keyboard-accessible buttons,
then choose Run workflow. There is no implicit compute or persistence. Editing
source/steps, successful recipe import or Cancel invalidates results and terminates
the current worker. Late replies cannot restore old output. A successful empty
string is exportable; idle, running and failed runs have no final exports. A failed
step retains only successful intermediates from that run.

Select an intermediate step to inspect its full text. Only one intermediate and
the final textarea are mounted, so a maximum-size run does not render up to sixteen
large controls at once. Changing the selected preview never reruns the worker or
changes export ownership.

| Operation | Contract |
| --- | --- |
| Trim | `String.trim()` on the entire text. |
| Uppercase | Default Unicode `toUpperCase`, reusing the existing pure service. |
| Reverse | `Intl.Segmenter('en', { granularity: 'grapheme' })`, including combining marks, flags and ZWJ emoji. Unsupported browsers receive a controlled error. |
| Remove duplicate lines | Existing PR39 service/options: case-sensitive all/consecutive/unique, blank policy, trim before comparison, UTF-16 sort afterwards; LF/CRLF/CR input produces LF output. |
| Base64 | Standard RFC4648 alphabet, canonical padding and pad bits; encode/decode UTF-8. ASCII whitespace is ignored when decoding, URL-safe/data-URI syntax rejected. Fatal UTF-8 decode, BOM preserved. Encoding rejects lone surrogates. |
| URL component | `encodeURIComponent` / `decodeURIComponent`; plus is literal, not form-url-encoded space. Malformed escapes/UTF-8 and lone-surrogate encode are controlled errors. |

Literal backslash escapes are text, not formatting directives. Final copy uses the
guarded native clipboard helper; final download is raw text encoded by Blob as
UTF-8. Recipe downloads contain only configuration. No transformation sends user
text to a server or writes it to storage. Application assets and translation files
still load over the network; this is not an offline-support claim.

## Admission and execution

| Boundary | Limit |
| --- | --- |
| Source before worker allocation | 65,536 UTF-16 units; nonempty source and at least one step required. |
| Steps | 16. |
| Each emitted output | 262,144 UTF-16 units. |
| Sum of emitted intermediate outputs | 1,048,576 UTF-16 units, final counted once as its last step. |
| Recipe before FileReader | 32,768 bytes. |
| Recipe text before JSON.parse | 32,768 UTF-16 units. |
| Worker deadline | 5,000 ms from construction start, checked again before publishing a reply. |

The engine preflights uppercase and encoding expansion where predictable, checks
every actual output and stops at the first failure. Other transforms do not grow
their input. Source/output limits bound work but are not strict CPU or heap quotas.
The module worker isolates synchronous processing from the UI and provides hard
termination on timeout/cancellation. Replies are schema/budget checked in the owner
before publication. Worker handlers, abort listeners and timer are removed on all
terminal paths. One run is owned at a time; a run's intermediates are published
atomically at completion/failure, not streamed while running.

## Recipes

```json
{"version":1,"steps":[{"type":"trim","options":{}},{"type":"base64","options":{"mode":"encode"}}]}
```

Exact top-level fields are `version` and `steps`; each step has `type` and `options`.
Options are empty for trim/uppercase/reverse; mode encode/decode for base64/url;
the existing four duplicate-line options for deduplicate. Unknown keys, types,
versions and operations are rejected. The fixed-depth validator reconstructs fresh
objects, never merges parsed data into application state and never executes code.
An empty recipe is valid configuration but cannot run until a step is added.

File reads are owned separately: replacement selection, edits and unmount cancel
older readers. Invalid imports report generic errors and preserve current steps and
results. Valid imports replace the entire configuration and invalidate the run;
source text is retained. Internal UI step IDs are neither persisted nor exported.

## Integration and verification

Sync hotspots: string tool registry/English metadata, SEO override, roadmap/backlog,
Pages browser CI selection. No legacy transformation UI, shared editor, hosting,
dependency, security policy or production branch is changed by this feature.

Tests use literal expected strings, independent recipe schemas and exact/one-over
limits. Worker and reader unit tests control I/O boundaries; native browser flows
cover real module workers, native clipboard forwarding, downloaded bytes, failed
imports, options, cancellation, mobile keyboard and static route content. Actual
commands, failures, measurements and final outcomes belong to the checkpoint/PR.

References: [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter),
[fatal TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/fatal),
[RFC4648](https://www.rfc-editor.org/rfc/rfc4648.html). Upstream issues 341/199 and
PR392 were reviewed on 2026-10-17: open/unmerged, with a different history/piping
scope. This implementation adds no automatic history or cross-tool storage bus.
