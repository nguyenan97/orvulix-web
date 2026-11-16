# Shared text file import ownership

`src/features/text-file-import/useTextFileImport.ts` owns one native FileReader per
mounted ToolTextInput/ToolCodeInput. Selecting a file replaces the current read.
Typing cancels before publishing the edit; an external value replacement and unmount
cancel in layout effects. A commit acknowledging the hook's own preceding change
does not cancel a newer reader. One pending publication value distinguishes that
acknowledgement from an external reset, without retaining a history of file text.
A no-file picker event leaves a current read
intact. Resetting the hidden input value permits retrying the same file.

Reader identity guards queued callbacks. Cleanup clears handlers and identity
before aborting a LOADING reader, so our cancellation produces no error notice.
Successful, failed and replaced readers release handlers. Construction/read errors,
native errors/abort and unexpected non-string results produce a generic actionable
message, without paths, filenames or contents. The latest committed callbacks are
used even when a parent rerenders without changing the value.

The hook preserves native readAsText behavior: default browser decoding/BOM rules,
empty files and decoded Unicode/literal escape text. It adds no normalization,
parsing, persistence, file upload or extension restrictions. The separate
[foundation task](JSON_RESOURCE_LIMITS.md) adds a 1 MiB pre-read byte cap and a
1,048,576-unit decoded-text cap, with explicit rejection and no truncation.
The input/editor may normalize newline presentation as before. Whole-file decoding
and subsequent editor/service processing can still allocate or block; aborting a
FileReader does not preempt downstream synchronous application work.

## Tests and boundaries

Component tests exercise both adapters with controlled reader completion/error
and queued late callbacks, including a newer read started before the preceding
onChange value commits. Monaco alone is stubbed in those unit tests. Browser
flows use the actual editor and native FileReader decoding; a test-only startup
gate orders reads against edits, replacement selections and SPA unmount without
sleep/timing races. Existing clipboard browser cases retain actual native writes.
This gate is not a browser decoder implementation or proof of large-file safety.

## Sync hotspots and follow-up

Integrations: two shared input components (picker and edit callbacks); test CI's
focused browser list. No tool services, locales, router, SEO generation or hosting
configuration changed. Reconcile this adapter if upstream changes input contracts.

Follow-up owner: Orvulix maintainers. File admission does not preempt downstream
editor/tool work or constrain pasted input in unrelated consumers. Other file
inputs, larger-document worker support and pending clipboard notification
ownership require separate investigations.

A pre-existing JSON Prettify follow-up was confirmed during native validation:
its compute function leaves the prior result when source becomes empty. Owner:
Orvulix maintainers. The JSON Prettify result-ownership branch addresses that trigger (see JSON_PRETTIFY.md); its PR determines merge status. The scoped fix must
clear stale output/errors on empty/invalid edits and retain formatting/copy/download
semantics for valid JSON with component and native browser coverage. This task
asserts the imported source model, and deliberately preserves tool computation.

### Existing Firefox native-clipboard intermittency

At01e4a8f the full production browser run passed53/54: the existing mobile-dark
text-input copy case timed out waiting for the native clipboard promise after a
successful import. The same case/timeout is present in the pre-task PR32 run
(input-copy-browser-final.log,44/45). Without application/test changes, the current
case passed3 isolated diagnostic repetitions, then the full Firefox18-case suite
passed. All9 new cross-engine import cases and all15 Pages cases passed.

Disposition: non-blocking pre-existing clipboard intermittency for this develop
import-lifecycle delivery, not a resolved bug or proof of a browser/platform root
cause. The first53/54 result remains reported. Owner: Orvulix maintainers. Follow-up
acceptance: capture native write start/settle/rejection, focus/activation and page
ownership across full cross-engine runs; reproduce and fix the confirmed cause or
define actionable pending-write UX, keeping real native writes/assertions and
unchanged retries/deadlines. Do not suppress the test or count diagnostic reruns
as a passing original suite. Scratch log names identify historical evidence only;
the PR records outcomes durably without committing synthetic clipboard payloads.
