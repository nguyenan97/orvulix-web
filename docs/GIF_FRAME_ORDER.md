# Images to GIF frame order

## Execution prompt

Add explicit frame ordering to Images to GIF. Keep the existing bounded image
importer and show a numbered ordered list with full filenames and Move earlier /
Move later buttons. Support keyboard and stable frame identity, including duplicate
files/names. A successful adjacent move immediately invalidates old/current GIF
output and never auto-encodes; Create snapshots the new array order. A boundary
move is a no-op. Keep file objects, preview URLs and importer order identities
unchanged. Importer external-value synchronization cancels any unfinished batch
when reordering, and the UI must explain that behavior. Preserve Create/Cancel,
per-owner busy settlement, timing, encoder/FIFO, mixed-format limits and download
cleanup. Do not add drag/drop reordering, dependencies, uploads or persistence.
Verify actual downloaded GIF frame pixels/order plus stale-run/import ownership,
keyboard/mobile and Pages prefix/noindex; review full diff and pass exact-head
CI, then merge one PR into develop and clean up only its completed branch.

## Design and boundaries

- Feature-local generic adjacent array move and FrameOrder UI. The GIF route
  composes the panel after its existing input. No shared input/importer/hook/
  encoder API changes. Array position controls playback; importer `order` is a
  stable identity, not a sort key. Buttons at first/last boundaries are disabled.
- A valid move shallow-copies the array and swaps two existing entries; it never
  recreates File/preview objects or renumbers identity. Invalid indices return
  the original reference so no edit invalidation occurs. At most 20 entries,
  bounded by the existing importer. Duplicate names and repeated File objects
  remain independent entries with distinct importer identities.
- Full filenames render as React text with wrapping. Accessible names include
  current position and filename. After a move, a layout effect focuses the moved
  list item by its stable identity, whose accessible label includes its new
  position. No timeout, drag-only affordance or filename-based key.
- Route onChange goes through existing invalidate/setFiles. Reordering while
  encoding aborts publication immediately and retains busy until settlement;
  later Create uses the current array. No hard worker preemption claim.
- Existing importer sync cancels pending batches on external replacement;
  reordering therefore cancels an unfinished import rather than overwriting it.
  Retained preview URLs stay owned/alive, Clear/remove/unmount release them, and
  later imports append with distinct identity. Explicit copy tells users about
  cancelling unfinished import work. Do not change shared import semantics.
- Data: accepted local file references -> bounded array swap -> React text and
  existing encoder. No new HTML/URL/file/network sink, codec, dependency or storage.
  FFmpeg core assets and app icons can still download. Existing controls/audit/
  secret scan/CodeQL apply; auth/backend/container controls N/A.

## Acceptance

| ID | Given/When/Then | Evidence |
| --- | --- | --- |
| A1 | Move a middle frame earlier/later; exact entries swap without mutation or identity/URL changes; boundaries no-op | Pure and UI tests |
| A2 | Keyboard move exposes updated numbered order and focus on the moved item, duplicate filenames distinguish by position | DOM and native mobile |
| A3 | Move after a result or during encode; old download disappears, late completion/error cannot publish, retry waits for settlement | Route deferred encoder + genuine native EXEC |
| A4 | Create after reordering produces the chosen pixel/frame order and preserved timing/dimensions/loop | Real download plus independent GIF decoder, homogeneous/mixed fixtures |
| A5 | Move while import pending cancels that batch, preserves retained URLs, later append/remove/Clear/unmount behave correctly | Existing ImportSession contract regression + native real importer |
| A6 | No auto encode, existing GIF regressions, SEO and Pages prefix/noindex remain correct | Job/UI, native specs and build/Pages checks |

## Research, maintenance and rollback

Reviewed 2026-10-20: upstream issue433 is closed and PR458 merged drag/drop, not
frame ordering. Frame ordering is an Orvulix enhancement, not a claim that issue433
explicitly requested it or that upstream accepted it. Existing PR25/26/27/59 import,
ownership, mixed fidelity and explicit Create behavior are preserved.
Sources: https://github.com/iib0011/omni-tools/issues/433 and
https://github.com/iib0011/omni-tools/pull/458 .

Native GIF fixtures retain the existing core0.12.6 CDN URL interception to installed
@ffmpeg/core0.12.10. They verify actual worker/artifact behavior, not CDN availability
or byte equivalence between versions. Decoder covers these simple fixtures, not
arbitrary GIF disposal modes. No new upstream code/dependency/license adopted.

Sync hotspots: inherited GIF route, English video copy, GIF SEO and focused CI
list. Rollback removes the panel/route integration and metadata claims, retaining
explicit Create. Owner Orvulix maintainer: percentage progress, timing UX/quality
and drag-based ordering require separate scopes. No data migration or production
release is implied.
