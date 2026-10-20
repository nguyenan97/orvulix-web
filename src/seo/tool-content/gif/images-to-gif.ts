import type { ToolSeoOverride } from '../../types';
const content: ToolSeoOverride = {
  title: 'Images to GIF - Create and Cancel Animation | Orvulix',
  description:
    'Choose images and frame timing, then explicitly create an animated GIF in your browser. Cancel pending output, adjust the inputs and create again.',
  howTo: [
    'Select or drop images into Input Images. Importing does not automatically encode a GIF.',
    'Choose FPS or frame delay and its value. Editing files or timing clears old output.',
    'Choose Create GIF and wait for the current job. The first Create may download FFmpeg core assets.',
    'Preview and download animated.gif. Cancel GIF creation discards output; wait for previous work to settle before creating again.'
  ],
  notes: [
    'Processing uses the existing browser FFmpeg worker. Core JavaScript and WebAssembly assets download from unpkg.com; this is not an offline claim. No image upload or automatic input persistence is added.',
    'Cancel, edits, Clear and navigation invalidate publication cooperatively. Active FFmpeg startup or exec cannot be interrupted by this tool; temporary-file cleanup can fail if the worker/filesystem fails.',
    'Create is disabled while the same owner has an unsettled encode, including cancelled work. This does not establish a global queue or hard memory/CPU quota.',
    'Mixed PNG/JPEG batches require equal decoded dimensions and the existing static image/byte/pixel limits. Quality, inherited frame timing, FPS/delay ranges and output filename are unchanged. Richer progress and encoder optimization remain separate.'
  ]
};
export default content;
