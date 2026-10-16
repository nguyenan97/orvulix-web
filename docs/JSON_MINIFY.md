# JSON Minify current result ownership

Scope: `/json/minify`, implemented on this task branch. The PR records merge
status; development delivery is separate from production release.

## Behavior and integration

The inherited page skipped computation for empty input, retaining the last valid
output. Parser failures were written directly into the result editor and could
be copied/downloaded as if they were JSON. Two actual-page tests reproduce these
behaviors before the fix.

`src/features/json-minify/result.ts` wraps the unchanged minifyJson service with
empty/invalid/unavailable/valid outcomes. The page memoizes the current source's
outcome during render; no previous result or language is retained in state.
MinifyOutput displays a generic named inline MUI alert for errors and reuses the
existing ToolCodeResult disabled contract for unavailable output. Empty input has
no alert; invalid whitespace does. Recovery clears the error immediately. Monaco
can apply its value prop later in its lifecycle, but result actions already belong
to the current React outcome. The page's no-op compute bypasses only its legacy
ToolContent effect; shared forms, examples and other tools remain unchanged.

Valid JSON Lines retain line order, compact per-line values and blank-line
filtering from parseJsonInput/minifyJson. Format and download extension belong to
the current valid outcome: JSONL exports .jsonl; subsequent JSON exports .json.
Nonvalid output uses default JSON highlighting without retaining a prior format.
Native primitive, duplicate-key, literal escape and numeric precision semantics
remain unchanged. This is not lossless JSON. Native parser details can contain
user data, so they are not rendered or exported; controlled parser-error prefixes
identify syntax failures. Stringification failures get size/depth guidance.

## Evidence and limitations

Unit coverage uses the actual service plus real ToolContent/Formik page adapters,
stubbing only Monaco. It tests invalid/empty transitions, JSONL/JSON formats,
primitive values, blank lines, duplicate keys, native numeric precision, Unicode,
message privacy, invalid actions and recovery. A parseable deeply nested value
reproduces stringify failure separately from invalid syntax.

Native tests use the actual pinned Monaco renderer, native file reads/keyboard
edits, native clipboard and downloaded bytes. They cover JSONL -> invalid -> empty
-> JSON, filenames/extensions, Unicode/literal escapes and mobile/dark example
recovery on Chromium/Firefox/WebKit. Pages checks retain prefixed routes and noindex.
The deterministic page tests do not claim to prove every native editor behavior.

Parsing/stringification and editor rendering still process whole input synchronously;
there is no byte/CPU deadline, worker isolation or hard memory quota. Already
initiated clipboard/download gestures are not revoked by later edits; pending
clipboard notification ownership remains a separate follow-up. Existing Firefox
clipboard intermittency is tracked in TEXT_FILE_IMPORT.md, not declared resolved.

Owner: Orvulix maintainers. Follow-up acceptance for parser budgets: measure real
input/CPU/allocation costs, define supported JSON/JSONL limits and cancellation or
rejection UX, then test timeout/recovery without silently changing accepted data.
Other tools require their own observed regressions before migration.

## Upstream sync hotspots

Keep the small JSON Minify page adapter (derived outcome, input language, output
child and no-op compute) when syncing upstream. Parser error prefix classification
must be reviewed if parseJsonInput changes. Preserve ToolCodeResult's opt-in
validity guard from PR35, browser regressions and shared static/React roadmap copy.
No parser service, locales, dependencies, routes or hosting configuration changed.
