/**
 * SEO content for /pdf/protect-pdf. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/lib/ghostscript/background-worker.js:85-135
 * - src/lib/ghostscript/background-worker.js:96-122,156-171
 * - src/lib/ghostscript/gs-worker.js:826-827,842-871; src/lib/ghostscript/worker-init.ts:15-41
 * - src/pages/tools/pdf/protect-pdf/index.tsx:26-57; src/pages/tools/pdf/protect-pdf/service.ts:16-44
 * - src/pages/tools/pdf/protect-pdf/index.tsx:66-107
 * - src/components/ToolContent.tsx:26-33
 * - src/components/input/BaseFileInput.tsx:72-99,163-196; src/components/result/ToolFileResult.tsx:53-78,174-181
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Protect PDF - Add a Password to a PDF File | Orvulix',
  description:
    'Add a password to a PDF so it must be entered to open the file. Type the password twice, and the encrypted copy is saved as yourfile-protected.pdf.',
  howTo: [
    'Click the "Input PDF" box or drag a PDF file onto it.',
    'Under "Password Settings", type a password in the "Password" field.',
    'Type the same password in the "Confirm Password" field.',
    'When the file appears under "Protected PDF", click "Download" to save it.'
  ],
  examples: [
    {
      title: 'Lock a contract',
      description:
        'contract.pdf with the same password typed in both fields -> contract-protected.pdf, which requires that password to open.'
    }
  ],
  notes: [
    "The PDF is rewritten by Ghostscript's pdfwrite device (WebAssembly, in a Web Worker) with PDF 1.4 compatibility, using your password as both the user (open) password and the owner password.",
    'Both fields must match and cannot be empty; otherwise the tool shows "Passwords do not match" or "Password cannot be empty".',
    'If you edit the password after a file was produced, the previous result stays in place until both fields match again.',
    'The output name is the original name with .pdf replaced by -protected.pdf.',
    'The Ghostscript WebAssembly binary is requested from cdn-wasm.b-cdn.net when processing starts; the PDF and password are passed to the worker locally, and the worker makes no other network request.'
  ],
  faq: [
    {
      question:
        'Can I set separate open and owner passwords or choose permissions?',
      answer:
        'No. The one password you enter is used as both the user password and the owner password, and the tool has no permission settings to choose.'
    },
    {
      question: 'Why is no protected PDF produced?',
      answer:
        'The Password and Confirm Password fields must contain the same, non-empty value. While they differ or are empty, the tool shows an error message and does not create a new file; an earlier result, if any, is not replaced until they match.'
    },
    {
      question: 'Does the tool download anything?',
      answer:
        'Yes. Each run starts a Web Worker that fetches the Ghostscript WebAssembly binary from cdn-wasm.b-cdn.net. The PDF is read from a local blob URL and encrypted inside that worker.'
    }
  ]
};

export default content;
