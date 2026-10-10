/**
 * SEO content for /converters/video-to-gif. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/converters/video-to-gif/index.tsx lines 16-20, 42-85, 87-118; public/locales/en/converters.json videoToGif.*
 * - src/pages/tools/converters/video-to-gif/types.ts
 * - src/pages/tools/converters/video-to-gif/service.ts
 * - src/components/input/ToolVideoInput.tsx lines 27-34, 67-117; src/components/input/file-input-utils.ts formatTime
 * - src/utils/string.ts updateNumberField
 * - src/components/result/ToolFileResult.tsx lines 53-79, 174-181; src/components/result/ResultFooter.tsx
 * - src/lib/ffmpeg.ts lines 4-46; node_modules/@ffmpeg/util/dist/esm/index.js; node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Video to GIF Converter with Trim and Quality | Orvulix',
  description:
    'Turn part of a video into an animated GIF: set the start and end, pick Low to Ultra quality (5 to 15 fps, 240 to 640 px wide) and download it.',
  howTo: [
    'Add a video in the Input Video box: click the box or Select files, press Ctrl+V to paste, or drag and drop the file.',
    'Drag the two handles of the slider on the video preview to set the start and end. You can also type seconds into Start Time and End Time under Timestamps.',
    'Under Quality, choose Low, Medium, High or Ultra. Medium is selected by default.',
    'Wait for the conversion. It runs again about one second after you change the range or the quality.',
    'Check the animation under Output GIF and click Download to save it.'
  ],
  examples: [
    {
      title: 'Three-second clip at Medium',
      description:
        'clip.mp4 with Start Time 5 and End Time 8 at Medium -> clip.gif covering seconds 5 to 8, at 10 fps and 320 px wide.'
    },
    {
      title: 'Ultra quality from Full HD',
      description:
        'A 1920x1080 video at Ultra -> a GIF 640x360 pixels at 15 fps.'
    }
  ],
  notes: [
    'Quality presets: Low is 5 fps and 240 px wide, Medium is 10 fps and 320 px, High is 15 fps and 480 px, and Ultra is 15 fps and 640 px. The height follows the source aspect ratio.',
    'The GIF is made in two FFmpeg passes. First, palettegen builds a color palette from the selected segment. Then paletteuse applies that palette when the frames are encoded.',
    "Start Time and End Time are in seconds. The slider moves in 0.1-second steps, and when a video loads with the default range, End Time is set to the video's full length.",
    'Processing uses FFmpeg compiled to WebAssembly. Its core files are downloaded from unpkg.com the first time any FFmpeg-based tool runs in the open tab. The video is then read and converted in the browser.'
  ],
  faq: [
    {
      question: 'What units do Start Time and End Time use?',
      answer:
        'Seconds. The slider on the preview shows the range as minutes:seconds and moves in 0.1-second steps.'
    },
    {
      question: 'How can I get a smaller GIF?',
      answer:
        'Choose a lower Quality preset, which uses fewer frames per second and a narrower width, or shorten the range between Start Time and End Time.'
    },
    {
      question: 'Is my video uploaded?',
      answer:
        'The tool downloads the FFmpeg WebAssembly core from unpkg.com, then reads your video with FileReader and converts it in the browser. It does not send the video over the network.'
    }
  ]
};

export default content;
