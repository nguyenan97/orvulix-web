# JSON Prettify result ownership

Scope: `/json/prettify`, implemented on this task branch. PR metadata is the source
of merge status; development delivery is separate from a production release.

The inherited page retained result state until a later successful computation.
Empty input skipped compute; invalid input threw into ToolContent's snackbar path.
Both left the old formatted value available for copy/download. Component regression
tests reproduce both transitions against the original page.

## Current outcome

`src/features/json-prettify/result.ts` delegates formatting to the existing service
and returns a typed empty/invalid/unavailable/valid outcome. The result component reads the
current source and Formik indentation primitives in the same render. It memoizes
that pure calculation without queued result/error state. Monaco may apply its
value prop during its own editor lifecycle; action availability already belongs
to the current React outcome, preventing stale copy/download during that update.

Empty source clears output/message and disables actions. Whitespace-only source
is invalid, preserving native parser semantics. Invalid source clears output and
shows one generic inline MUI alert. Valid input/options replace the output and
remove validation immediately, without a parse-error snackbar surviving recovery.
A valid but unsupported formatting operation gets generic size/depth guidance,
not a false syntax claim. Other notifications, such as clipboard errors, retain
their existing lifecycle. An already initiated native clipboard/download gesture
is not revoked by later edits; pending notice ownership remains separate.

The page's legacy ToolContent compute callback is deliberately a named no-op.
ToolContent still owns Formik/options/examples; only this result child derives the
outcome. This avoids migrating the shared effect and unrelated tool services.
ToolCodeResult adds an optional disabled prop with defaultfalse and guarded events,
forwarding existing ResultFooter support. Other consumers keep their prior defaults.

## Semantics, tests and limits

No parser/formatter or option-parsing rewrite. Native JSON.parse/stringify behavior
is retained for false/0/null/strings, duplicate keys, Unicode/literal escapes,
indentation and numeric precision. This is not lossless JSON processing. Parsing,
formatting and Monaco still consume whole input synchronously; no hard resource
quota, deadline or worker isolation is claimed.

Pure tests characterize relevant outcomes and existing semantics; actual-page
component tests use real ToolContent/Formik/formatter, stubbing only the editor
boundary. Browser tests use real Monaco, native file reads, keyboard edits and
parsed downloaded text, alongside existing clipboard policy flows. Empty/invalid
controls cannot write a clipboard or allocate a download; recovery and options
always produce the latest valid text. Security tests/rendering do not execute HTML
strings as markup; error messages do not include input or native parser details.

## Sync hotspots and follow-ups

Hotspots: JSON Prettify page adapter; optional ToolCodeResult action validity;
feature result component reading the existing Formik contract; browser spec and
roadmap copy/tests. Keep this wiring when syncing upstream page changes. No shared
ToolContent migration, locales, routing, hosting settings or dependencies changed.

Owner: Orvulix maintainers. Other tools may retain results after failed computation;
review each actual consumer before a separate migration. Acceptance: reproduce the
specific trigger, define output/error/action ownership and retain its valid service
semantics with component/native tests. Resource limits require measured byte/CPU
budgets and rejection/recovery UX before being advertised. PR34's inherited Firefox
native-clipboard intermittency remains separately documented in TEXT_FILE_IMPORT.md;
this result correction does not establish or fix its cause.
