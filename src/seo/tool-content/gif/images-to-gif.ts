import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Images to GIF - Frame Order and Animation | Orvulix',
  description:
    'Reorder images, choose frame timing and create an animated GIF in your browser. Move frames with keyboard controls, cancel output and create again.',
  howTo: [
    'Select or drop images into Input Images. Importing does not automatically encode a GIF.',
    'Use Move earlier or Move later in Frame order. Frames play top to bottom; moving clears output and cancels an unfinished import.',
    'Choose FPS (1 to 60) or frame delay (50 to 10000 ms). Switching modes approximately preserves the interval where both ranges allow it; boundary/default adjustments are disclosed. Invalid drafts disable Create; edits clear old output.',
    'Choose Create GIF and wait for the current job. The first Create may download FFmpeg core assets.',
    'Preview and download animated.gif. Cancel GIF creation discards output; wait for previous work to settle before creating again.'
  ],
  notes: [
    'Frame order controls use the accepted file list, including duplicate filenames. Reordering keeps previews, clears current output and requires a new Create gesture.',
    'Processing uses the existing browser FFmpeg worker. Core JavaScript and WebAssembly assets download from unpkg.com; this is not an offline claim. No image upload or automatic input persistence is added.',
    'Cancel, edits, Clear and navigation invalidate publication cooperatively. Active FFmpeg startup or exec cannot be interrupted by this tool; temporary-file cleanup can fail if the worker/filesystem fails.',
    'Create is disabled while the same owner has an unsettled encode, including cancelled work. This does not establish a global queue or hard memory/CPU quota.',
    'Mixed PNG/JPEG batches require equal decoded dimensions and the existing static image/byte/pixel limits. Explicit unit labels and requested timing guidance are implemented. GIF stores 10 ms ticks; the encoder may round timing or repeat the final frame, so actual frame count and playback duration can differ from the request. FPS/delay ranges, encoder behavior and output filename are retained. Richer progress, per-frame timing and quality/file-size optimization remain separate.'
  ]
};
export default content;
