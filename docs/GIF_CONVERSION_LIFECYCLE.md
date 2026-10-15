# Images to GIF job ownership

Implementation snapshot on feature/gif-conversion-lifecycle, based on develop
PR25/d96ab5b. Resolve final merge status through the implementation PR. Automatic
1000ms debounce, FPS/delay options, FFmpeg arguments, animated.gif filename and
encoding semantics remain unchanged. No Create mode or timing/quality redesign.

## Ownership and integration

src/features/gif-conversion/latest-job.ts owns the debounce timer, generation and
AbortController. File callbacks and actual option edits invalidate output/error/
loading immediately, before Formik's compute effect schedules a new snapshot.
Only current generation may publish success/error/loading. Re-selecting an already
selected option is a no-op rather than clearing output with no subsequent compute.
Hook unmount cleanup invalidates publication and clears pending debounce; existing
ToolFileResult owns/revokes output preview URLs. Async failures become an actionable
current-run alert, not an unhandled Promise caught only by ToolContent's sync try.

Small existing integrations: GIF UI, its service and src/lib/ffmpeg.ts. Type-only
options/input imports avoid introducing registry/i18n into the scheduler. No new
runtime dependency, tool route/registry, Netlify setting or production change.

## Cancellation boundaries

runFFmpegTask takes an optional AbortSignal. It checks before load/admission, after
shared load and at the queued callback's turn. An aborted queued GIF body cannot
write files or encode. Existing callers without a signal preserve FIFO/result and
temporary-file cleanup behavior. Queue nodes still settle in order; cancellation
does not promise immediate physical removal of a queued Promise/closure.

The GIF service checks around fetch/write/exec/read. Active ffmpeg.exec and shared
startup cannot be preempted; they may finish after Clear or navigation. Output is
discarded, then registered temporary files are deleted in the existing finally.
Abort never calls resetFFmpeg/terminate or disrupts another caller's shared worker.
There is no hard CPU/memory quota. This does not change startup asset URL ownership,
general conversion budgets or lifecycle of any other converter.

## Evidence and regression

Baseline browser flow: two PNGs -> active conversion -> Clear -> zero input files,
but an old downloadable 32x32/three-frame GIF returned. Clear before debounce did
not reproduce that failure. Baseline with installed real core 0.12.10:
homogeneous PNG and JPEG pairs at FPS 10 have delays [12,8,8] centiseconds; delay
200ms has [20,20,20]. Both have 32x32 dimensions, three frames, loop 0, red followed
by blue composited frames. This task preserves those existing timing/frame rules.

Unit tests use deferred encoders/fake timers for ownership and real queue/service
code with a mocked worker boundary for cooperative checkpoints, cleanup and other
callers. UI tests isolate i18n bootstrap/network from fake-timer cleanup assertions;
real-browser tests verify actual output. Browser worker-message observation forwards
all real messages, triggers Clear/SPA navigation at EXEC and waits for its genuine
completion. It does not fabricate encoded bytes or completion signals.

Browser fixtures serve installed @ffmpeg/core 0.12.10 to the unchanged production
0.12.6 CDN request. This verifies real WASM behavior, not production CDN availability
or byte-for-byte equivalence of those core versions. No user data is persisted.

## Separate follow-ups

Owner: Orvulix maintainer. Mixed PNG/JPEG baseline can produce only the first frame
(the existing concat path receives different input codecs). This was observed
before implementation and is not fixed here: a separate normalization/fidelity
change must preserve homogeneous timing and validate mixed-format full frame order.
Do not describe this lifecycle PR as completing all GIF conversion capabilities.

Other consumers' stale exports/cancellation, shared startup asset ownership and
Pages deployment timeout remain independent tasks. No Pages retry/config change
is performed to test this work. Web/URL conversion remains paused.
