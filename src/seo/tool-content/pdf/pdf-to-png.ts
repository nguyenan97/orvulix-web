/**
 * SEO content for /pdf/pdf-to-png. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/pdf/pdf-to-png/service.ts:13-41
 * - src/pages/tools/pdf/pdf-to-png/service.ts:37-48
 * - src/pages/tools/pdf/pdf-to-png/service.ts:2-5
 * - node_modules/pdfjs-dist/build/pdf.mjs:967-1038 (pdfjs-dist 5.4.149)
 * - node_modules/pdfjs-dist/build/pdf.mjs:7143,7177,12579-12627; src/pages/tools/pdf/pdf-to-png/service.ts:18
 * - src/pages/tools/pdf/pdf-to-png/index.tsx:43-67
 * - src/components/result/ToolMultiFileResult.tsx:43-52,145-163
 * - src/components/input/BaseFileInput.tsx:72-99,163-196
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'PDF to PNG - Convert PDF Pages to PNG Images | Orvulix',
  description:
    'Convert every page of a PDF into a PNG image rendered at 2x scale with PDF.js. Download pages one by one or get all of them together in a ZIP file.',
  howTo: [
    'Click the "Upload a PDF" box or drag a PDF file onto it.',
    'Wait while "Converting PDF pages" is shown; every page is converted automatically.',
    'Review the page previews under "Converted PNG Pages".',
    'Click "Download page-N.png" under a preview to save one page, or "Download All as ZIP" to save every page.'
  ],
  examples: [
    {
      title: 'Three-page Letter document',
      description:
        'report.pdf with 3 US Letter pages -> page-1.png, page-2.png and page-3.png, each 1224 x 1584 px, plus report-pages.zip containing all three.'
    }
  ],
  notes: [
    'Pages are rendered with PDF.js at scale 2, so each PDF point becomes 2 pixels.',
    'Every page is converted; there are no options for page selection or resolution.',
    'Images are named page-1.png, page-2.png and so on; the ZIP is named after the PDF with -pages.zip in place of .pdf.',
    "Rendering happens in the browser on a canvas; the PDF.js worker script is served from the site's own assets, and the tool sets no external font, CMap or WASM URLs."
  ],
  faq: [
    {
      question: 'What resolution are the PNG images?',
      answer:
        'Each page is rendered at 2 pixels per PDF point. A US Letter page (612 x 792 points) becomes a 1224 x 1584 px PNG.'
    },
    {
      question: 'Can I convert only some pages?',
      answer:
        'No. The tool converts every page. You can still download only the pages you need with the per-page download buttons.'
    },
    {
      question: 'Can I download all pages at once?',
      answer:
        'Yes. Download All as ZIP saves a ZIP named after your PDF, for example report-pages.zip, containing every PNG.'
    }
  ]
};

export default content;
