/**
 * SEO content for /pdf/convert-to-pdf. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/pdf/convert-to-pdf/index.tsx:21-25,64-77
 * - src/pages/tools/pdf/convert-to-pdf/index.tsx:86-170; public/locales/en/pdf.json (convertToPdf.options.*)
 * - src/pages/tools/pdf/convert-to-pdf/index.tsx:43; src/pages/tools/pdf/convert-to-pdf/service.ts:105-148
 * - src/components/input/ToolMultipleImageInput.tsx:40-69,85-93
 * - src/pages/tools/pdf/convert-to-pdf/service.ts:5,84-141
 * - src/pages/tools/pdf/convert-to-pdf/service.ts:69-82,150-158
 * - src/components/input/ToolMultipleImageInput.tsx:34-93,179-196; src/components/input/InputFooter.tsx:20-34
 * - src/pages/tools/pdf/convert-to-pdf/service.ts:5,89-96; index.tsx:117-119
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Images to PDF - Convert JPG, PNG, HEIC to PDF | Orvulix',
  description:
    "Turn PNG, JPG, WEBP, GIF, HEIC or HEIF images into one PDF. Use pages that match each image's size, or A4 pages with orientation and scale options.",
  howTo: [
    'Click "Select files" under "Input Images" and choose one or more PNG, JPG, WEBP, GIF, HEIC or HEIF images; click it again to add more.',
    'Under "PDF Type", choose "Full Size (Image size)" or "A4 Page".',
    'For A4 Page, pick "Portrait (Vertical)" or "Landscape (Horizontal)" under "Orientation" and set the "Scale" slider between 10% and 100%.',
    'Check the PDF under "Output PDF" and click "Download".'
  ],
  examples: [
    {
      title: 'One wide image at full size',
      description:
        'A 1920 x 1080 px image with Full Size (Image size) -> one landscape page of 508.0 x 285.7 mm with the image filling the page.'
    },
    {
      title: 'Several photos on A4',
      description:
        'Three photos with A4 Page, Portrait, Scale 80% -> merged-images.pdf with three portrait A4 pages, each photo fitted to the page, reduced to 80% and centered.'
    }
  ],
  notes: [
    'Each image becomes one page. Pages follow the order in which images were added, but after you remove images, newly added ones can be placed before older ones, so press Clear and re-add the images if the order matters.',
    "Full Size pages use the image's pixel size at 0.264583 mm per pixel (96 pixels per inch), and the tool lists each image's size in mm and px.",
    "A4 Page keeps each image's aspect ratio, fits it inside the page, applies the Scale percentage and centers it.",
    'HEIC and HEIF files are converted to JPEG with the heic-to library when they are added.',
    'A single image produces a PDF named after the image; several images produce merged-images.pdf. Images that cannot be decoded are skipped.'
  ],
  faq: [
    {
      question: 'Which image formats can I convert to PDF?',
      answer:
        'The file picker accepts PNG, JPEG, WEBP, GIF, HEIC and HEIF. HEIC and HEIF images are converted to JPEG when you add them.'
    },
    {
      question: 'What is the difference between Full Size and A4 Page?',
      answer:
        'Full Size (Image size) makes each page exactly as large as its image, with the image filling the page. A4 Page uses A4 pages in the orientation you choose and centers each image, fitted to the page and scaled by the Scale slider.'
    },
    {
      question: 'Can I change the order of the pages?',
      answer:
        'There is no reorder control. Pages follow the order in which images were added, so to get a specific sequence, press Clear and add the images again in the order you want.'
    }
  ]
};

export default content;
