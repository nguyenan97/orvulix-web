/**
 * SEO content for /pdf/compress-pdf. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/lib/ghostscript/background-worker.js:9-27,56-66
 * - src/lib/ghostscript/background-worker.js:28-54
 * - src/lib/ghostscript/worker-init.ts:4-41
 * - src/lib/ghostscript/gs-worker.js:826-827,842-871,897-917; src/lib/ghostscript/background-worker.js:36-70
 * - src/pages/tools/pdf/compress-pdf/service.ts:13-28; src/pages/tools/pdf/utils.ts:1-16
 * - src/pages/tools/pdf/compress-pdf/index.tsx:16-18,66-88,126-221
 * - src/pages/tools/pdf/compress-pdf/index.tsx:100-124
 * - public/locales/en/pdf.json (compressPdf.*)
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Compress PDF - Reduce PDF File Size Online | Orvulix',
  description:
    'Shrink a PDF with Ghostscript at Low, Medium or High compression, then compare the original and compressed file sizes before you download the result.',
  howTo: [
    'Click the "Input PDF" box or drag a PDF file onto it.',
    'Under "Compression Settings", choose "Low Compression", "Medium Compression" or "High Compression" (Low is selected by default).',
    'Wait while "Compressing PDF..." is shown; the result appears under "Compressed PDF".',
    'In the "Compression Settings" panel, compare "Original File Size" with "Compressed File Size", then click "Download".'
  ],
  examples: [
    {
      title: 'Smaller file for sharing',
      description:
        "report.pdf with High Compression -> report.pdf rewritten with Ghostscript's /screen preset; the new size is shown as Compressed File Size."
    }
  ],
  notes: [
    "Compression runs Ghostscript's pdfwrite device, compiled to WebAssembly, inside a Web Worker and writes output with PDF 1.4 compatibility.",
    "Low, Medium and High map to Ghostscript's /printer, /ebook and /screen PDFSETTINGS presets.",
    "The Ghostscript WebAssembly binary is requested from cdn-wasm.b-cdn.net when compression starts; your PDF is passed to the worker as a local blob URL and written to Ghostscript's in-memory file system, and the worker makes no other network request.",
    'The compressed file keeps the original file name.',
    'When the PDF can be read, the settings panel shows its original file size and number of pages; the compressed size is added after compression.'
  ],
  faq: [
    {
      question: 'What do the compression levels do?',
      answer:
        "Low Compression uses Ghostscript's /printer preset, Medium uses /ebook and High uses /screen. The tool describes them as minimal quality loss, a balance of size and quality, and maximum size reduction with some quality loss."
    },
    {
      question: 'Will my PDF always get smaller?',
      answer:
        'Not necessarily. The tool returns whatever Ghostscript produces and does not compare sizes, so check Compressed File Size against Original File Size before downloading.'
    },
    {
      question: 'Does the tool download anything?',
      answer:
        'Yes. Each compression run starts a Web Worker that fetches the Ghostscript WebAssembly binary from cdn-wasm.b-cdn.net. The PDF itself is read from a local blob URL and processed inside that worker.'
    }
  ]
};

export default content;
