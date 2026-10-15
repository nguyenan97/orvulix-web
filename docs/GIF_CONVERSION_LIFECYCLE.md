# Images to GIF job ownership

Implementation snapshot on feature/gif-conversion-lifecycle, based on develop
PR25/d96ab5b. Resolve final merge status through PR #26. Automatic
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
discarded, then the existing finally attempts deletion of all registered temporary
files. Cleanup remains best effort if the worker/filesystem itself fails.
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

## Validation snapshot / review

Runtime and tests reviewed at 1978f15 (subsequent documentation-only changes do not
alter this runtime). Focused unit tests: 20; full unit suite: 1173 / 132 files.
Native GIF browser tests: 24 / 24 across Chromium, Firefox and WebKit, decoding real
PNG/JPEG GIF bytes and testing active Clear/navigation and asset failure recovery.
PNG/multi-file regression: 23 / 24 in the combined run; the Firefox image-to-PDF
navigation case reported Download is starting, then passed 1 / 1 in isolation with
unchanged assertions/timeouts. No PDF integration or encoding change was needed.
Owner follow-up for that intermittent preview/navigation interaction: reproduce
and distinguish PDF iframe download behavior from navigation/application defects
before modifying other converters or their regression coverage.

Production build validates 157 static routes with matching sitemap and 404.
Pages build validates 158 dev HTML files. Pages smoke loads the actual worker
under /orvulix-web/assets/, downloads/decodes the real three-frame GIF and verifies
Clear, noindex and absence of production canonical.
Security tests: 26 passed. Audit: 15 package findings / six advisory IDs, zero
unaccepted high/critical, unchanged braces exception. CodeQL run 38680424587 at
1978f15 reports the same five baseline findings/dispositions in
SECURITY_REMEDIATION.md; no new rule/location. This is not an empty alerts claim.
Full-diff review covers generation ownership, debounce, option no-ops, FIFO/shared
startup compatibility, all abort boundaries including cleanup, URL ownership,
errors/recovery, runtime imports, UI and scoped integration. No remaining blocking
finding identified for this lifecycle scope. Exact final-head CI/merge status must
be resolved through PR #26, not inferred from this snapshot.
