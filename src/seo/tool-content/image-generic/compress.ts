/**
 * SEO content for /image-generic/compress. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/image/generic/compress/service.ts:13-19
 * - src/pages/tools/image/generic/compress/service.ts:29-31,43-50
 * - src/pages/tools/image/generic/compress/index.tsx:18-21,103-122; src/utils/string.ts:35-47
 * - src/pages/tools/image/generic/compress/index.tsx:126-145; public/locales/en/image.json compress.fileSizes/originalSize/compressedSize
 * - public/locales/en/image.json compress.*
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs.map sourcesContent lib/utils.js (handleMaxWidthOrHeight)
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs.map sourcesContent lib/image-compression.js, lib/utils.js (canvasToFile)
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs.map sourcesContent lib/image-compression.js
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs (copyExifWithoutOrientation, getApp1Segment); lib/index.js in source map
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs.map sourcesContent lib/index.js, lib/web-worker.js; package.json version 2.0.2
 * - node_modules/browser-image-compression/dist/browser-image-compression.mjs; dist/browser-image-compression.js (grep count 0)
 * - src/components/input/ToolMultipleImageInput.tsx:34-56
 * - src/components/input/InputFooter.tsx:21-23; public/locales/en/translation.json inputFooter.importFromFile, resultFooter.download; src/components/result/ToolMultiFileResult.tsx:145-163
 * - src/components/ToolContent.tsx:26-33
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Compress Images Online: JPG and PNG in Bulk | Orvulix',
  description:
    'Compress one or more images in your browser. Set a maximum size in MB and a quality level, then download each file or all of them as a ZIP.',
  howTo: [
    'Click "Select files" under Images Input and choose one or more images.',
    'In Compression options, set the maximum output file size per image in megabytes (default 1).',
    'Enter the image quality percentage (default 80). A lower value gives a smaller file.',
    'Check the File sizes panel, which shows the total original size and the total compressed size in KB.',
    'Click Download to save a single image. If you compressed several, use the per-file download buttons or "Download All as ZIP".'
  ],
  examples: [
    {
      title: 'Large camera photo',
      description:
        'A 4000x3000 JPEG with the default settings (1 MB, quality 80) is scaled to 1920x1440 and saved as a JPEG at 80% quality. If it is still over 1 MB, further passes lower the quality and the dimensions.'
    },
    {
      title: 'Batch of images',
      description:
        'Three images in -> three compressed images, each with its original file name, plus compressed-images.zip containing all of them.'
    }
  ],
  notes: [
    'Images whose width or height is above 1920 px are scaled down so the longer side is 1920 px, keeping the aspect ratio.',
    'Every file keeps its file name, and JPEG and PNG files keep their format. PNGs are re-encoded with the UPNG encoder, which limits the number of colors based on the quality setting.',
    'The maximum size is a target, not a guarantee. If the first result is over the target or larger than the original, up to 10 more passes lower the quality. If the first result was over the target, each pass also shrinks the dimensions by 5%. The last result is kept even if it is still over the target.',
    'EXIF metadata from a JPEG is copied into the compressed JPEG, with the orientation tag reset to 1.',
    "Compression runs in your browser in a Web Worker. The worker downloads the browser-image-compression script from cdn.jsdelivr.net, and if the worker fails, compression runs on the page's main thread instead."
  ],
  faq: [
    {
      question: 'Why do my compressed images have fewer pixels?',
      answer:
        'The tool caps the longer side at 1920 px, so larger images are scaled down to fit. If an image is still over the maximum file size after the first pass, its dimensions shrink by 5% on each extra pass.'
    },
    {
      question: 'Will every file end up under the maximum size I set?',
      answer:
        'Not always. The compressor makes up to 10 extra passes, lowering the quality each time, and then returns the last result even if it is still above the target.'
    },
    {
      question: 'Does compression keep EXIF data?',
      answer:
        'For JPEG files, yes: the EXIF block is copied into the compressed JPEG, with the orientation tag set to 1. Other formats are re-encoded from canvas pixels, so their metadata is not copied.'
    },
    {
      question: 'Can I compress HEIC photos?',
      answer:
        'When you select a HEIC file, it is first converted to JPEG with a .jpg name. That JPEG is then compressed.'
    }
  ]
};

export default content;
