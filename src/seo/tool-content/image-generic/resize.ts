/**
 * SEO content for /image-generic/resize. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/generic/resize/index.tsx:19-26
 * - src/pages/tools/image/generic/resize/index.tsx:28-49,145-183; src/components/ToolContent.tsx:26-33,82-86
 * - src/pages/tools/image/generic/resize/index.tsx:88-188; public/locales/en/image.json resize.*
 * - src/pages/tools/image/generic/resize/index.tsx:204-210
 * - src/pages/tools/image/generic/resize/service.ts:19-98
 * - src/pages/tools/image/generic/resize/service.ts:100-146
 * - src/lib/ffmpeg.ts:4-5,15-46; node_modules/@ffmpeg/util/dist/esm/index.js:147-150
 * - node_modules/@ffmpeg/util/dist/esm/index.js:39-62
 * - src/pages/tools/image/generic/resize/service.ts:148-207
 * - src/pages/tools/image/generic/resize/service.ts:236-257
 * - src/components/result/ToolMultiFileResult.tsx:145-163
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Resize Images Online by Pixels or Percentage | Orvulix',
  description:
    'Resize JPG, PNG, WebP, GIF and SVG images by pixel width, height or percentage, with an optional aspect ratio lock. Batches download as a ZIP.',
  howTo: [
    'Click "Select files" under Input Images and choose JPG, PNG, WebP, GIF or SVG files.',
    'Under Resize Method, choose "Resize by Pixels" or "Resize by Percentage".',
    'For pixels, keep "Maintain Aspect Ratio" checked, pick "Set Width" or "Set Height" and type the value. To enter both Width and Height, uncheck it.',
    'For percentage, enter a value in the Percentage field (50 halves the size, 200 doubles it).',
    'Download the resized image. For several images, use the per-file buttons or "Download All as ZIP".'
  ],
  examples: [
    {
      title: 'Set width with aspect ratio',
      description:
        '1200x800 JPG, Resize by Pixels, Set Width 600 with Maintain Aspect Ratio -> 600x400 JPG.'
    },
    {
      title: 'Scale by percentage',
      description: '640x480 PNG at 200% -> 1280x960 PNG.'
    },
    {
      title: 'Vector SVG',
      description:
        'SVG with only viewBox "0 0 100 50", Set Width 800 -> the same SVG with width="800" and height="400".'
    }
  ],
  notes: [
    'Each file keeps its file name and type. When you resize several images, they are also bundled as resized-images.zip.',
    'JPG, PNG and WebP images are redrawn at the new size on an HTML canvas in your browser.',
    'SVG files are not rasterized. Only the width and height attributes change, and a viewBox is added if missing, so the file stays vector.',
    'GIFs are resized with FFmpeg compiled to WebAssembly, using a generated palette. The first GIF triggers a download of the FFmpeg core files from unpkg.com.'
  ],
  faq: [
    {
      question: 'Can I stretch an image to exact dimensions?',
      answer:
        'Yes. Uncheck Maintain Aspect Ratio and enter both Width and Height. The image is drawn at exactly those dimensions, even if that changes its proportions.'
    },
    {
      question: 'Does resizing an SVG reduce its quality?',
      answer:
        "No. The tool only rewrites the SVG's width and height attributes (adding a viewBox if missing), so the result is still a vector file."
    },
    {
      question: 'What happens the first time I resize a GIF?',
      answer:
        'The tool downloads the FFmpeg WebAssembly core (ffmpeg-core.js and ffmpeg-core.wasm) from unpkg.com and reuses it for later GIFs. JPG, PNG, WebP and SVG resizing does not use FFmpeg.'
    }
  ]
};

export default content;
