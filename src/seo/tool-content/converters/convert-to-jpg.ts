/**
 * SEO content for /converters/convert-to-jpg. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/converters/convert-to-jpg/index.tsx:18-21,110-124
 * - src/pages/tools/converters/convert-to-jpg/index.tsx:68,75-81,130-135
 * - src/pages/tools/converters/convert-to-jpg/service.ts:3,14-25; src/components/input/ToolMultipleImageInput.tsx:44-56
 * - src/pages/tools/converters/convert-to-jpg/service.ts:1,27-64
 * - src/pages/tools/converters/convert-to-jpg/service.ts:93-102
 * - node_modules/color-string/index.js:1-40
 * - public/locales/en/converters.json convertToJPG.*
 * - src/components/options/ColorSelector.tsx:29-48
 * - src/components/result/ToolMultiFileResult.tsx:158-163; src/components/result/ResultFooter.tsx:24-30
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Convert Images to JPG from PNG, WebP or HEIC | Orvulix',
  description:
    'Convert PNG, WebP, HEIC and other images to JPG. Set the quality from 1 to 100% and pick a background color that fills any transparent areas.',
  howTo: [
    'Click "Select files" under Input Images and choose one or more images.',
    'In Conversion Settings, set the Conversion Quality slider (1-100%, default 85%).',
    'Type a background color for transparent areas (default #ffffff), or click the palette icon to pick one.',
    'Wait about one second for JPG Images to update, then click Download. For several files, use "Download All as ZIP".'
  ],
  examples: [
    {
      title: 'Transparent PNG on black',
      description:
        'logo.png with a transparent background, background color #000000 -> logo.jpg with black where it was transparent.'
    },
    {
      title: 'WebP to JPG',
      description:
        'photo.webp (1200x900) at 85% quality -> photo.jpg (1200x900).'
    },
    {
      title: 'HEIC photo',
      description: 'IMG_0001.heic -> IMG_0001.jpg'
    }
  ],
  notes: [
    'Each image is drawn on an HTML canvas in your browser and encoded as JPEG at the chosen quality. Pixel dimensions do not change.',
    'JPG has no transparency, so the image is drawn over a solid background color. The field accepts hex, rgb(), hsl() or CSS color names, and an invalid value falls back to white.',
    'HEIC files are detected and decoded with the heic-to library before conversion.',
    'Each output keeps the original base name with a .jpg extension. Several results are zipped as converted-images.zip.'
  ],
  faq: [
    {
      question: 'What happens to the transparent parts of a PNG?',
      answer:
        'They are filled with the background color you set, which is white (#ffffff) by default.'
    },
    {
      question: 'Can I convert HEIC photos to JPG?',
      answer:
        'Yes. HEIC files are detected and decoded with the heic-to library, then encoded as JPG with your quality setting.'
    }
  ]
};

export default content;
