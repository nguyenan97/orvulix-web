# Images to GIF: explicit Create and Cancel

## Execution prompt

Change Images to GIF from automatic 1000ms debounced encoding to explicit Create
GIF. Import, remove, Clear and actual timing edits immediately invalidate old
output without starting an encode. Create snapshots the currently accepted listed
files and current Formik options. Add Cancel and accessible phase feedback. Do
not admit another encode for the same mounted owner while a previous encode
promise is still settling, including after cancellation or edits. Cancel discards
publication cooperatively; do not terminate/reset the shared FFmpeg worker or
claim a running exec can be preempted. Preserve timing values, frame order,
mixed PNG/JPEG normalization, budgets, filenames and download/URL cleanup. Add
meaningful ownership/UI tests and decode real GIF artifacts in native browsers.
Update documentation, English control copy, SEO and scoped roadmap status. Verify
production and Pages prefix/noindex, review full diff and pass exact-head CI,
then merge one PR into develop and clean up only its completed branch.

## Scope, boundaries and decisions

- Existing route `/gif/images-to-gif`, React18/MUI, existing importer and encoder.
  No dependency/codec/asset version, shared ToolContent, FFmpeg queue, network,
  hosting or other converter changes. New PNG encoder/OCR work is separate.
- The route supplies a stable no-op to ToolContent's automatic compute effect.
  Its option group renders explicit controls using the live Formik values and
  current accepted files. This avoids altering every inherited tool's contract.
- `LatestGifJob.run` owns one immediate invocation, a snapshot, generation and
  AbortController. Debounce is removed. A separate busy callback describes the
  lifetime of the encoder promise; `GifState.loading` describes the current
  publishable run. Invalidation clears output/error/loading immediately while
  busy remains true until the old promise settles.
- Create is disabled with no accepted files or while busy; Cancel is enabled
  only for the current loading run. Cancelling/edits disable further Create until
  settlement, preventing repeated clicks from queuing more work for this owner.
  Remounting creates a new owner; the shared FIFO still serializes its work behind
  earlier callers. This is not a global queue/memory quota.
- Importer preview decoding still happens during import. Its accepted file list
  is the Create snapshot; if a later import commit changes that list, the current
  run is invalidated. No automatic GIF encoding or FFmpeg core request is initiated
  by selecting files or changing options through this route.
- Cancel, edits, Clear and unmount abort ownership. They cannot preempt shared
  FFmpeg startup or active exec. Existing service checkpoints discard output and
  clean temporary files in finally, best effort on worker/filesystem failure.
  Busy/phase messages explicitly say cancelled work may still be finishing.
- Existing ToolFileResult owns preview URLs. No stale result is passed to it.
  No input persistence/upload is added. FFmpeg core JS/WASM still download from
  the existing CDN on first Create; local processing is not an offline claim.
- Frame timing, quality and output contents remain inherited behavior. No
  percentage progress, encoder optimization, new formats or timing UX redesign.

## Acceptance and validation

| ID | Given/When/Then | Evidence |
| --- | --- | --- |
| A1 | Import/edit accepted frames or timing, wait beyond old debounce, no encode until Create | DOM fake-timer regression; native worker/core request observation |
| A2 | Create snapshots current ordered files/options and runs once immediately | Job/UI tests and decoded real artifact metadata/pixels/timing |
| A3 | Cancel/edit/Clear invalidates old output and late success/error; new Create blocked until settlement | Deferred encoder tests and genuine native worker EXEC cancellation/recovery |
| A4 | Error and unmount clean ownership, preserve URL cleanup and allow valid retry | Job/DOM and native startup error, Clear/navigation and recovery |
| A5 | Homogeneous/mixed images keep frame order, delays, dimensions, alpha policy and limits | Existing GIF specs updated with explicit user gestures; retain assertions |
| A6 | Controls/phase labels keyboard/mobile, SEO and Pages remain valid | Native screenshot/keyboard, build validators, prefix/noindex smoke |

Mocked encoder tests prove scheduling/ownership, not encoded fidelity. Native
tests forward real worker messages and use installed @ffmpeg/core 0.12.10 at the
existing 0.12.6 CDN URLs as before; this does not test CDN availability or prove
those versions byte-identical. No retry/deadline/assertion weakening is authorized.

## Discovery and maintenance

Reviewed 2026-10-20: upstream issue #433 is closed; PR #458 merged drag/drop,
not explicit Create. Existing Orvulix import/lifecycle/mixed-format work is kept.
Source: https://github.com/iib0011/omni-tools/issues/433 and
https://github.com/iib0011/omni-tools/pull/458 . No upstream acceptance claim.

Sync hotspots: inherited GIF route, English video locale, existing GIF native
spec gestures, metadata/SEO. Feature-local hook/job own scheduling and busy state.
Rollback restores the prior scheduler/hook/route and its automatic test gestures.
No data migration. Owner Orvulix maintainer: hard preemptive cancellation/global
queue isolation and encoder quality require separate contracts and regressions.
