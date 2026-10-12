/**
 * SEO content for /converters/convert-to-webp. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/converters/convert-to-webp/index.tsx:18-21,112-134
 * - src/pages/tools/converters/convert-to-webp/index.tsx:73,80-86,136-140
 * - src/pages/tools/converters/convert-to-webp/service.ts:60-98
 * - src/pages/tools/converters/convert-to-webp/service.ts:1,74-83 (compare src/pages/tools/converters/convert-to-jpg/service.ts:1); grep of src, vite.config.ts, index.html for a global Color: none
 * - src/pages/tools/converters/convert-to-webp/service.ts:34-42
 * - public/locales/en/converters.json convertToWebp.*
 * - src/components/input/ToolMultipleImageInput.tsx:34-56
 * - src/components/result/ToolMultiFileResult.tsx:145-163
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Convert Images to WebP Online in Bulk | Orvulix',
  description:
    'Convert JPG, PNG and other images to WebP with a quality slider from 1 to 100%. Converting several images at once gives you a ZIP download.',
  howTo: [
    'Click "Select files" under Input Images and choose one or more images.',
    'In Conversion Settings, drag the Conversion Quality slider (1-100%, default 100%). Higher values give better quality and larger files.',
    'Wait about one second after a change for the WEBP Images result to update.',
    'Click Download for a single image. For several, use the per-file buttons or "Download All as ZIP".'
  ],
  examples: [
    {
      title: 'Single image',
      description: 'photo.png (800x600) -> photo.webp (800x600).'
    },
    {
      title: 'Transparent logo',
      description:
        'logo.png with a transparent background -> logo.webp with a white background.'
    },
    {
      title: 'Batch',
      description:
        'a.jpg and b.png -> a.webp and b.webp, plus compressed-images.zip containing both.'
    }
  ],
  notes: [
    'Each image is drawn on an HTML canvas in your browser and encoded with the canvas WebP encoder at the chosen quality.',
    'Transparent areas are filled with white, so the WebP output has no transparency. In the current version, the Background color field does not change this.',
    'Pixel dimensions do not change. Each file keeps its base name with a .webp extension, and several results are zipped as compressed-images.zip.',
    'HEIC files are converted to JPEG when you select them and then converted to WebP.'
  ],
  faq: [
    {
      question: 'Does the WebP output keep transparency?',
      answer:
        'No. The tool fills the canvas with white before drawing the image, so transparent areas become white.'
    },
    {
      question: 'Will converting change the image dimensions?',
      answer:
        'No. The canvas uses the original width and height, so only the format and compression change.'
    }
  ]
};

export default content;
