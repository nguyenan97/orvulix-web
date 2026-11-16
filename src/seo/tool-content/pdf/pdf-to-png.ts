/** SEO contract: PDF conversion service, features/pdf-conversion and owned result previews. */
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
    'Every page is converted within the displayed limits; there are no options for page selection or resolution.',
    'Input limits: 32 MiB and 500 pages. Conversion deadline: 30 seconds. Render limits: 4096 pixels per side, 8 Mi pixels per page and 32 Mi pixels total. PNG and ZIP output are each limited to 64 MiB. Large documents are rejected with an error; try fewer pages.',
    'Clear or a replacement PDF cancels the current job and removes its output. Failed conversions show an error and can be retried.',
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
