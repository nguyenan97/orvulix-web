/**
 * SEO content for /video/compress. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/video/compress/index.tsx lines 17-44, 71-113; public/locales/en/video.json compress.resolution, compress.quality, compress.lossless, compress.default, compress.worst
 * - src/pages/tools/video/compress/index.tsx lines 69, 115-138; public/locales/en/video.json compress.inputTitle, compress.resultTitle, compress.loadingText
 * - src/pages/tools/video/compress/service.ts lines 5-47
 * - src/components/input/ToolVideoInput.tsx lines 16-22, 56-65
 * - src/components/input/BaseFileInput.tsx lines 126-143
 * - src/components/result/ToolFileResult.tsx lines 142-148, 174-181
 * - src/lib/ffmpeg.ts lines 4-46
 * - grep of 'lib/ffmpeg' in src (e.g. src/pages/tools/audio/trim/service.ts, src/pages/tools/image/generic/resize/service.ts)
 * - node_modules/@ffmpeg/util/dist/esm/index.js readFromBlobOrFile, fetchFile
 * - node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js lines 102-112; node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js lines 7-33
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Compress Video to MP4 with Resolution and CRF | Orvulix',
  description:
    'Compress a video by choosing an output width from 240 to 1080 px and an H.264 CRF quality level, then download the re-encoded MP4 file.',
  howTo: [
    'Add a video in the Input Video box: click the box or Select files, press Ctrl+V to paste, or drag and drop the file.',
    'Under Resolution, choose 240p, 360p, 480p, 720p or 1080p. 480p is selected by default.',
    'Move the Quality (CRF) slider from 0 to 51. The marks show Lossless at 0, Default at 23 and Worst at 51.',
    'Wait for "Compressing video..." to finish. Compression runs again about one second after you change an option.',
    'Preview the result under Compressed Video and click Download to save the MP4.'
  ],
  examples: [
    {
      title: 'Full HD landscape clip',
      description:
        'clip.mov at 1920x1080 with 480p and CRF 23 -> clip_compressed_480p.mp4 at 480x270, encoded with H.264 (libx264).'
    },
    {
      title: 'Vertical phone video',
      description:
        'A 1080x1920 video with 720p selected -> a 720x1280 MP4, because the option sets the width.'
    }
  ],
  notes: [
    "The Resolution options set the output width in pixels (240, 360, 480, 720 or 1080). The height follows the aspect ratio and is rounded to an even number, using FFmpeg's scale=W:-2.",
    'The tool does not cap the width at the source size. Choosing a width larger than the original upscales the video.',
    'Video is re-encoded with libx264 at the chosen CRF, and audio is re-encoded to AAC at 128 kbps. The output is always an MP4 file named <name>_compressed_<width>p.mp4.',
    "Processing uses FFmpeg compiled to WebAssembly. Its core JavaScript and WASM files are downloaded from unpkg.com the first time any FFmpeg-based tool runs in the open tab. The video file is read in the browser and processed in FFmpeg's in-memory file system."
  ],
  faq: [
    {
      question: 'Does 480p mean the video will be 480 pixels tall?',
      answer:
        'No. The selected value sets the width. A 1920x1080 video at 480p becomes 480x270, and a 1080x1920 vertical video at 720p becomes 720x1280.'
    },
    {
      question: 'Which CRF value should I use?',
      answer:
        '23 is the default. Lower values keep more quality: 0 is marked Lossless. Higher values give smaller, lower-quality files, and 51 is marked Worst.'
    },
    {
      question: 'Is my video uploaded?',
      answer:
        'The tool downloads the FFmpeg WebAssembly core from unpkg.com, then reads your video with FileReader and encodes it in the browser. It does not send the video over the network.'
    }
  ]
};

export default content;
