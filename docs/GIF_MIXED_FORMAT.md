# Mixed PNG/JPEG GIF fidelity

Implementation on feature/gif-mixed-format-fidelity, based on develop 4a8489c
(PR26 merged). Resolve delivery/merge status through its feature PR, not this
implementation snapshot. No new dependencies or other converter changes.

## Confirmed baseline and resulting behavior

On 4a8489c, both PNG -> JPEG and JPEG -> PNG produced only the first frame, with
zero delay. PNG -> JPEG -> PNG lost JPEG, leaving red/green/green with incorrect
durations. Downloaded bytes were decoded; animated preview alone was not evidence.
Homogeneous pairs produce three frames/loop0: FPS10 delays [12,8,8] centiseconds,
delay200ms [20,20,20]. Those paths and encoder arguments remain unchanged.

Mixed inputs now normalize each source sequentially in the same FFmpeg task to
static RGBA PNG, then use the existing concat/scale/loop encoder. This avoids codec
and pixel-format changes between concat segments. No nested queue call, extra
worker, browser canvas, implicit resizing or new encoder/quality mode is introduced.
Input order is preserved. The existing final duplicate-frame/timing rules remain:
pairs yield three frames; the three-source fixture yields four, FPS10
[12,8,12,12]cs or delay200 [20,20,20,20]cs. This is not a timing redesign.

## Supported policy

- Applies when content signatures identify both PNG and JPEG. Extensions/MIME do
  not choose the normalization codec. Homogeneous paths and other codec-only mixes
  retain their existing behavior; this does not fix every accepted image format.
- All members of a normalized batch must be static PNG or JPEG. APNG and a third
  unsupported format are rejected. JPEG metadata supports SOF0/1/2. Metadata before
  required image headers/data must fit within 256 KiB; unusual variants may reject.
- Decoder autorotation is retained. Normalized frames must have equal decoded
  width/height, otherwise a controlled error asks users to resize. No stretch,
  padding, implicit crop or normalization-to-first-frame aspect ratio change.
- Existing GIF palette/alpha conversion is retained, not a promise of lossless
  color or partial transparency. A browser regression compares a transparent PNG
  frame against the homogeneous PNG baseline before an opaque JPEG frame.
- Nonzero normalization/final mixed encoding exit codes reject the job, rather
  than publishing a partial output. Known policy errors are actionable UI alerts;
  unexpected errors retain the generic conversion message. Edits/Clear recover.

## Resource bounds and cancellation

Mixed-batch bounds: 20 images, 16 MiB/source, 64 MiB combined source, 4096px/edge,
4 megapixels/frame and 16 megapixels combined. Source headers are checked before
writes/decode. FFmpeg decoder max_pixels is set to 4000000. Decoded output geometry
and cumulative pixels are checked again before concat.

Normalized PNGs are checked after encoding/readback: 20 MiB/frame and 64 MiB total.
Final GIF is checked after encoding/readback: 32 MiB. These are admission/output
checks, not hard allocation/CPU quotas; FFmpeg may allocate before a post-encode
check. One source is fetched/written/normalized/read at a time, its source file is
removed early, and normalized files stay until concat. Extra JS readback copies
are transient; WASM high-water memory and GC reclamation are not guaranteed.

All source/normalized/list/GIF paths register with the existing queue finally.
Deletion is best effort if the worker/filesystem fails. Signal checkpoints surround
header reads, fetch/write/normalization/read/delete and existing GIF encoding.
Queued obsolete tasks skip their body; active synchronous work is not preempted.
Clear/navigation discard late results without resetFFmpeg/terminate. A cancellation
or failure leaves the shared queue available to other callers.

## Validation and integration hotspots

Pure/header policy tests use synthetic metadata, not claims of successful decoding.
Queue/service tests cover actual integrations with a mocked FFmpeg boundary,
including normalization/concat/output failure, cancellation and owned file cleanup.
Real-browser tests use actual FFmpeg and decode downloaded GIFs for frame order,
content, dimensions, loop, timing, alpha baseline, invalid/dimension errors,
normalization/concat Clear, navigation/unmount, edits and recovery.

Browser fixtures route installed real @ffmpeg/core0.12.10 to the unchanged CDN
0.12.6 request. This does not verify production CDN delivery or byte equivalence
between core versions. No user data persistence/upload is introduced.

Sync hotspots: GIF service (optional mixed path and output checks), latest-job
controlled policy error handling, and one added browser spec in existing Pages CI.
The isolated module owns normalization/policy; shared FFmpeg architecture, importer,
UI controls, locales, registry, SEO and hosting settings are unchanged.

## Remaining scoped follow-ups

Owner: Orvulix maintainer. Different-size mixed frames currently reject rather than
resize; a future resize/pad feature needs explicit UX/aspect-ratio policy and actual
pixel assertions. Other codec mixes, rare JPEG variants, GIF quality/timing/Create
mode, shared startup ownership, other converters' lifecycle and previous Pages
deploy timeout remain separate work. No automatic continuation or deploy retry.
