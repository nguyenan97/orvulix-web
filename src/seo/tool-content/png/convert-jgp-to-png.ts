/**
 * SEO content for /png/convert-jgp-to-png. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/png/convert-jgp-to-png/index.tsx:13-17
 * - src/pages/tools/image/png/convert-jgp-to-png/index.tsx:36-75,109
 * - src/pages/tools/image/png/convert-jgp-to-png/index.tsx:78-93
 * - src/pages/tools/image/png/convert-jgp-to-png/index.tsx:100-139
 * - src/utils/color.ts:1-19
 * - src/components/input/BaseFileInput.tsx:72-99,126-143,186,224-231; public/locales/en/translation.json baseFileInput.selectFileDescription
 * - node_modules/color-string/index.js:1-40; node_modules/color/index.js:47
 * - src/components/result/ToolFileResult.tsx:174-181; src/components/result/ResultFooter.tsx
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JPG to PNG Converter with Transparency | Orvulix',
  description:
    'Convert a JPG image to PNG in your browser. Optionally make one color, such as a white background, transparent with an adjustable similarity value.',
  howTo: [
    'Click the Input JPG box to choose a JPG, drag and drop one onto it, or press Ctrl+V to paste an image.',
    'For a straight conversion, leave "Enable PNG Transparency" unchecked. The result appears under Output PNG.',
    'To remove a color, check "Enable PNG Transparency", then enter the color (default white) and the similarity percentage (default 10).',
    'Click Download to save the .png file, or click Copy to clipboard.'
  ],
  examples: [
    {
      title: 'Plain conversion',
      description:
        'photo.jpg (1024x768) -> photo.png (1024x768) with no transparency.'
    },
    {
      title: 'Remove a white background',
      description:
        'Transparency on, color white, similarity 10: a pixel of (230, 230, 230) becomes transparent, while (220, 220, 220) is kept.'
    }
  ],
  notes: [
    'Converts one image at a time. The PNG keeps the original pixel dimensions and file name, with a .png extension.',
    'With transparency on, every pixel in the image that matches the color becomes transparent, not only the background.',
    'A pixel matches when its color distance from the chosen color is at most the similarity percentage of a maximum distance of 510. So 10% means a distance of 51 or less.',
    'The color field accepts CSS color names, hex codes, rgb() or hsl() values. If the color cannot be parsed, the image is not processed.',
    'The conversion is drawn on an HTML canvas in your browser.'
  ],
  faq: [
    {
      question: 'Can I convert several JPG files at once?',
      answer:
        'No. This tool takes one image at a time. Selecting, dropping or pasting a new image replaces the current one.'
    },
    {
      question: 'Why did parts of my subject become transparent too?',
      answer:
        'Transparency applies to every pixel close enough to the chosen color, anywhere in the image. Lower the similarity percentage to match fewer shades.'
    }
  ]
};

export default content;
