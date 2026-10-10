/**
 * SEO content for /pdf/split-pdf. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/pdf/split-pdf/service.ts:9-47; src/pages/tools/pdf/split-pdf/service.test.ts:4-42
 * - src/pages/tools/pdf/split-pdf/service.ts:55-76
 * - src/pages/tools/pdf/split-pdf/index.tsx:59-97,143-166; public/locales/en/pdf.json (splitPdf.pdfPageCount, splitPdf.pageExtractionPreview)
 * - src/pages/tools/pdf/split-pdf/index.tsx:121-158; public/locales/en/pdf.json (splitPdf.inputTitle, pageSelection, pageRangesDescription, pageRangesPlaceholder, resultTitle)
 * - src/components/input/BaseFileInput.tsx:72-99,163-196
 * - node_modules/pdf-lib/es/api/PDFDocument.js:55-56,113-118 (fetch appears only in JSDoc comments)
 * - src/components/result/ToolFileResult.tsx:53-78,174-181
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Split PDF - Extract Pages from a PDF by Range | Orvulix',
  description:
    'Extract chosen pages from a PDF into a new file. Enter page numbers or ranges like 1,5-8, see how many pages will be kept, then download the result.',
  howTo: [
    'Click the "Input PDF" box or drag a PDF file onto it; the tool then shows how many pages the PDF has.',
    'Under "Page Selection", enter page numbers or ranges separated by commas, for example 1,5-8.',
    'Check the preview line that tells you how many pages will be extracted.',
    'Review the new file under "Extracted PDF" and click "Download" to save it.'
  ],
  examples: [
    {
      title: 'Specific pages',
      description:
        '10-page PDF with 1,5-8 -> a 5-page PDF containing pages 1, 5, 6, 7 and 8.'
    },
    {
      title: 'Reversed range',
      description:
        '10-page PDF with 8-3 -> pages 3, 4, 5, 6, 7 and 8, in ascending order.'
    },
    {
      title: 'Empty field',
      description:
        'No page numbers entered -> all pages are copied into the new file.'
    }
  ],
  notes: [
    'The result is a single PDF named after the original with .pdf replaced by -extracted.pdf (report.pdf becomes report-extracted.pdf).',
    'Selected pages are always output in ascending order, and duplicate entries are removed.',
    'Page numbers outside the document and non-numeric entries are ignored; ranges are clipped to the page count.',
    "Encrypted PDFs are rejected by pdf-lib's default loader, so they cannot be split.",
    'Pages are copied in the browser with pdf-lib, which makes no network requests.'
  ],
  faq: [
    {
      question: 'Does Split PDF create one file per page?',
      answer:
        'No. It creates one new PDF that contains only the pages you selected. To get separate files, run the tool once for each page or range.'
    },
    {
      question: 'Can I change the order of the pages?',
      answer:
        'No. Selected pages are sorted in ascending order and duplicates are removed, so entering 5,1 gives a PDF with page 1 followed by page 5.'
    },
    {
      question: 'What happens if I leave the page field empty?',
      answer:
        'All pages are included, so the output is a copy of the whole document.'
    }
  ]
};

export default content;
