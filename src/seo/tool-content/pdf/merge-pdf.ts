/**
 * SEO content for /pdf/merge-pdf. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/pdf/merge-pdf/service.ts:83-97
 * - src/pages/tools/pdf/merge-pdf/index.tsx:17-31
 * - src/components/input/ToolMultiplePdfInput.tsx:34-49,59-93,165-194
 * - src/components/input/InputFooter.tsx:20-34; src/components/result/ResultFooter.tsx:23-30
 * - public/locales/en/pdf.json (merge.inputTitle, merge.resultTitle); public/locales/en/translation.json (inputFooter.importFromFile, inputFooter.clear, toolMultipleInput.deleteFile, resultFooter.download)
 * - src/components/ToolContent.tsx:26-33
 * - node_modules/pdf-lib/es/api/PDFDocument.js:46,55-56,113-118
 * - node_modules/pdf-lib/es/api/PDFDocument.js (fetch only in comments); node_modules/pdf-lib/package.json:90-95
 * - src/components/result/ToolFileResult.tsx:53-78,174-181
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Merge PDF Files - Combine Multiple PDFs into One | Orvulix',
  description:
    'Combine several PDF files into one document named merged.pdf. Files are joined in the order you add them, and every page of each file is included.',
  howTo: [
    'Click "Select files" under the "Input PDF" box and choose the PDF files you want to combine; you can select several at once.',
    'Click "Select files" again to append more files; they are merged in the order shown in the list.',
    'Remove a single file with its "Delete file" (X) button, or press "Clear" to empty the list.',
    'Wait for the result under "Output merged PDF", then click "Download" to save merged.pdf.'
  ],
  examples: [
    {
      title: 'Cover page plus report',
      description:
        'Add cover.pdf (1 page), then report.pdf (12 pages) -> merged.pdf with 13 pages: the cover page first, followed by the 12 report pages.'
    }
  ],
  notes: [
    'Every page of each input file is copied into the new document, file by file, in list order.',
    'There is no control to reorder files; they are merged in the order in which they were added.',
    "Encrypted (password-protected) PDFs are rejected by pdf-lib's default loader, so they cannot be merged until the protection is removed.",
    'Merging is done in the browser with the pdf-lib library; neither the tool code nor pdf-lib sends the PDFs over the network.',
    'The output file is always named merged.pdf.'
  ],
  faq: [
    {
      question: 'In what order are the PDFs merged?',
      answer:
        'In the order they appear in the input list, which is the order you added them. To change the order, press Clear and add the files again in the sequence you want.'
    },
    {
      question: 'Can I merge password-protected PDFs?',
      answer:
        "No. Files are loaded with pdf-lib's default settings, which throw an error for encrypted PDFs, so no merged file is produced. Remove the password first."
    }
  ]
};

export default content;
