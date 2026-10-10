/**
 * SEO content for /image-generic/image-to-text. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/generic/image-to-text/index.tsx lines 16-19, 49-76, 86-99
 * - src/pages/tools/image/generic/image-to-text/service.ts getAvailableLanguages
 * - src/pages/tools/image/generic/image-to-text/service.ts extractTextFromImage
 * - src/components/ToolContent.tsx lines 26-33
 * - src/components/result/ToolTextResult.tsx lines 14, 26-50, 85; src/components/result/ResultFooter.tsx; public/locales/en/translation.json resultFooter
 * - src/components/input/BaseFileInput.tsx lines 72-99, 126-143, 224-230
 * - node_modules/tesseract.js/package.json; node_modules/tesseract.js/src/createWorker.js line 19
 * - node_modules/tesseract.js/src/worker/browser/defaultOptions.js; node_modules/tesseract.js/src/worker/browser/spawnWorker.js
 * - node_modules/tesseract.js/src/worker-script/browser/getCore.js
 * - node_modules/tesseract.js/src/worker-script/index.js lines 98-183
 * - node_modules/tesseract.js/src/worker-script/browser/cache.js
 * - node_modules/tesseract.js/src/worker/browser/loadImage.js; node_modules/tesseract.js/src/createWorker.js
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Image to Text OCR, Extract Text from JPG or PNG | Orvulix',
  description:
    'Extract text from a JPG or PNG image with Tesseract OCR in 12 languages, including English, Chinese, Japanese and Arabic, then copy or download it.',
  howTo: [
    'Add a JPG or PNG in the Input Image box: click the box or Select files, press Ctrl+V to paste, or drag and drop the file.',
    'Under OCR Options, choose the main language of the text from the language list. English is selected by default.',
    'Wait for the recognized text to appear in the Extracted Text box. It is recognized again whenever you pick another language.',
    'Click Copy to clipboard, or Download to save the text as a .txt file.'
  ],
  examples: [
    {
      title: 'Screenshot of a French document',
      description:
        'page.png with the language set to French -> the recognized French text in the Extracted Text box, ready to copy or download as .txt.'
    }
  ],
  notes: [
    'Available languages: English, French, German, Spanish, Italian, Portuguese, Russian, Japanese, Chinese (Simplified), Chinese (Traditional), Korean and Arabic. Each run uses one language.',
    'The file picker and drag and drop accept JPG and PNG images only.',
    "Text recognition uses Tesseract.js 6 in its LSTM-only mode. Each run starts a new OCR worker that loads the Tesseract.js worker script and OCR core from cdn.jsdelivr.net. The trained data for the selected language is also downloaded from cdn.jsdelivr.net, then cached in the browser's IndexedDB.",
    'Your image is read in the browser and passed to the OCR Web Worker. The downloads above fetch the OCR engine and language data and do not carry your image.',
    'The Detect Paragraphs option does not currently change the extracted text.'
  ],
  faq: [
    {
      question: 'Can I extract text from a PDF or a GIF?',
      answer:
        'No. The file picker and drag and drop accept only JPG and PNG images. Save the page or frame as a JPG or PNG first.'
    },
    {
      question: 'Can it read an image that contains two languages?',
      answer:
        'The language list allows one language per run. Pick the main language of the text, or run the image again with the other language selected.'
    },
    {
      question: 'What does the tool download?',
      answer:
        "Each run starts a Tesseract.js worker whose script and OCR core come from cdn.jsdelivr.net. The selected language's trained data is downloaded from cdn.jsdelivr.net the first time and then read from the browser's IndexedDB cache on later runs."
    }
  ]
};

export default content;
