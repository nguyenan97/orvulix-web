# Task checkpoint: text-file-import-ownership

- Updated: 2026-10-16 UTC
- Branch / base: feature/text-file-import-ownership / develop
- PR: not opened
- Phase: developing
- Delivery mode: develop-merge
- Authorization: current scoped implementation through exact-head gates only.
- Last verified base: 663b0dc; uncommitted shared hook, two input integrations and tests.

## Scope and acceptance

Native file reads in ToolTextInput/ToolCodeInput currently overwrite later edits,
new file selections and external resets; they also publish after unmount and hide
read failures. Own one read, abort/release on replacement/edit/reset/unmount, ignore
queued callbacks, report a generic actionable error and allow same-file retry.
Preserve FileReader.readAsText decoding, empty files, exact decoded strings,
clipboard behavior and existing file acceptance. Picker dismissal leaves the
current job intact. No new arbitrary file-size policy, parsing, worker or dependency.

## Completed and pending

Eight component regression tests failed against the original implementation in
both inputs (real stale content publication, missing cancellation/error notice).
A shared hook now owns reader identity and cleanup; input adapters route edits
through cancellation. Fourteen component cases now cover errors/retry/callback release. Pending: native browser flow, required gates,
docs, full Standards/Requirements review, exact-head CI and authorized merge.

## Validation and review

Red reproduction: /workspace/work/file-import-red.log (8 failures). Monaco is
stubbed only at component boundary in unit tests; native tests must retain real
Monaco and FileReader. Cleanup releases callbacks before abort to avoid reporting
our own cancellation as an error. File contents and error details are not logged.
No hard memory/CPU cap is claimed; whole-file text loading remains a follow-up.

## Resume point

Finish edge-case and native tests, then docs/validation. Preserve user-owned
public/sitemap.xml untracked (SHA256 5f9cf3fbeb7d4acfd9b7f0e79dd10ea184df2f4a8cfb11f6a529cf2f538d7df3).
No independent review claimed. Main/production/deployment policies untouched.

## Validation checkpoint after first browser iteration

PR34 head 653e8f3. Full units: 1288/141 pass; production build157/404,
security26/gate and targeted hook ESLint pass. First browser iteration found a
new test oracle error: empty imported source was incorrectly expected to clear
all Monaco models, including the inherited JSON result which compute intentionally
leaves unchanged on empty input. Corrected to assert the identified source model
is empty; do not change tool computation in this lifecycle task. Stopped the
remaining initial browser run to avoid repeating the known oracle failure.
A transient exec transport disconnect recovered; reader process/log persisted.
Runtime source is unchanged. Next: rerun all54 relevant browser cases, Pages and
final review/CI. Task PR remains draft; no merge authorization gate is bypassed.
