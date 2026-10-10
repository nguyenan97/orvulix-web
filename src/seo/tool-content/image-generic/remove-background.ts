/**
 * SEO content for /image-generic/remove-background. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/generic/remove-background/index.tsx lines 82-105
 * - src/pages/tools/image/generic/remove-background/index.tsx lines 28-50
 * - src/pages/tools/image/generic/remove-background/index.tsx lines 62-69; src/components/result/ToolFileResult.tsx lines 53-79
 * - src/pages/tools/image/generic/remove-background/index.tsx lines 53-60
 * - src/components/input/BaseFileInput.tsx lines 54-56, 72-99, 126-143, 185-229; public/locales/en/translation.json baseFileInput.selectFileDescription, inputFooter.importFromFile
 * - src/components/ToolContent.tsx lines 26-33
 * - src/components/result/ToolFileResult.tsx lines 39-51, 174-181; src/components/result/ResultFooter.tsx; public/locales/en/translation.json resultFooter
 * - node_modules/@imgly/background-removal/package.json; node_modules/@imgly/background-removal/dist/index.mjs lines 5223-5258
 * - node_modules/@imgly/background-removal/dist/index.mjs lines 948-1040
 * - node_modules/@imgly/background-removal/dist/index.mjs lines 901, 952, 970
 * - node_modules/@imgly/background-removal/dist/index.mjs lines 743-781, 895-910
 * - node_modules/@imgly/background-removal/dist/index.mjs lines 5291-5352, 782-806
 * - node_modules/@imgly/background-removal/dist/index.mjs line 5321 (init = memoize_default(initInference, ...))
 * - node_modules/onnxruntime-web/package.json; node_modules/onnxruntime-web/dist/ort.bundle.min.mjs (grep of http URLs)
 * - node_modules/heic2any/dist/heic2any.js (grep of http URLs)
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Remove Background from Image, Transparent PNG | Orvulix',
  description:
    'Remove the background from a JPG, PNG, WebP or HEIC photo with an AI segmentation model and download the cut-out subject as a transparent PNG.',
  howTo: [
    'Add a photo in the Input Image box: click the box or Select files, press Ctrl+V to paste an image, or drag and drop the file.',
    'Wait while the Transparent PNG panel shows "Removing background". Processing starts on its own and there are no options to set.',
    'Check the cut-out in the Transparent PNG panel.',
    'Click Download to save the PNG, or Copy to clipboard to paste it into another app.'
  ],
  examples: [
    {
      title: 'JPG photo to transparent PNG',
      description:
        'portrait.jpg -> portrait-no-bg.png at the same width and height as the original, with the background pixels made transparent.'
    },
    {
      title: 'iPhone HEIC photo',
      description:
        'IMG_1234.heic -> converted to PNG in the browser first, then saved as IMG_1234-no-bg.png.'
    }
  ],
  notes: [
    'Uses the @imgly/background-removal library with its default ISNet model (the fp16 "medium" variant), running on the CPU through ONNX Runtime Web\'s WebAssembly backend.',
    'The first time the tool runs in an open page, it downloads the model and the ONNX Runtime WebAssembly files from staticimgly.com. Your image is read from a local blob URL and decoded and processed in the browser.',
    'The model works on a 1024 x 1024 copy of the image. The mask is then scaled back, so the PNG keeps the original pixel dimensions.',
    "JPG, PNG and WebP are decoded directly, and HEIC files (image/heic type or .heic extension) are converted to PNG with heic2any first. Other types such as GIF or BMP are rejected by the library's decoder, so no PNG is produced.",
    'The output is always a PNG with an alpha channel, named after the original file with a -no-bg suffix.'
  ],
  faq: [
    {
      question: 'Which image formats can I use?',
      answer:
        'JPG, PNG and WebP images are processed directly. HEIC photos are converted to PNG first. The result is always a transparent PNG.'
    },
    {
      question: 'Is my photo uploaded to a server?',
      answer:
        "No. The tool reads the photo from a local blob URL and runs the model in your browser. The tool's network requests only download the model and ONNX Runtime files from staticimgly.com, and your image is not sent with them."
    },
    {
      question: 'Will the result have the same resolution as my original?',
      answer:
        'Yes. The model works on a 1024 x 1024 copy, but the mask is scaled back to the original width and height and applied to the original pixels.'
    }
  ]
};

export default content;
