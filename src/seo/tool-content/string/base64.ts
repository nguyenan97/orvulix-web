/**
 * SEO content for /string/base64. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/string/base64/service.ts lines 3-7
 * - src/pages/tools/string/base64/index.tsx lines 46-80; public/locales/en/string.json base64.*
 * - src/components/ToolContent.tsx FormikListenerComponent useEffect on [values, input]; src/pages/tools/string/base64/index.tsx compute: if (input) setResult(...)
 * - src/components/input/ToolTextInput.tsx handleFileChange; src/components/input/InputFooter.tsx; public/locales/en/translation.json inputFooter.importFromFile
 * - src/components/result/ToolTextResult.tsx handleDownload/handleCopy; src/components/result/ResultFooter.tsx; public/locales/en/translation.json resultFooter
 * - node_modules/buffer/index.js base64clean (INVALID_BASE64_RE, split('=')[0], padding loop)
 * - node_modules/buffer/index.js utf8Slice (codePoint = 0xFFFD, line 1012)
 * - Ran node with node_modules/buffer/index.js
 * - grep of node_modules/buffer/index.js, node_modules/base64-js/index.js, node_modules/ieee754/index.js, src and index.html
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'Base64 Encode and Decode Text Online | Orvulix',
  description:
    'Encode text to Base64 or decode Base64 back to UTF-8 text. Decoding also accepts URL-safe Base64, missing = padding and line breaks.',
  howTo: [
    'Under Base64 Options, choose Base64 Encode or Base64 Decode.',
    'Type or paste your text into the Input Data box, or click Select files to load a text file.',
    'Read the converted text in the Result box. It updates as you type or switch modes. If you delete all the input, the last result stays in the box.',
    'Click Copy to clipboard to copy the result, or Download to save it as a .txt file.'
  ],
  examples: [
    {
      title: 'Encode text',
      description: 'Base64 Encode: "Hello, World!" -> "SGVsbG8sIFdvcmxkIQ=="'
    },
    {
      title: 'Encode accented text as UTF-8',
      description:
        'Base64 Encode: "café" -> "Y2Fmw6k=" (the é is encoded as its two UTF-8 bytes).'
    },
    {
      title: 'Decode URL-safe Base64 without padding',
      description:
        'Base64 Decode: "aGk-Pz8_" -> "hi>???". The same text in standard Base64 is "aGk+Pz8/".'
    }
  ],
  notes: [
    'Encoding treats the input as UTF-8 and outputs standard Base64 (A-Z, a-z, 0-9, + and /) with = padding.',
    'When decoding, characters outside the Base64 alphabet, such as spaces and line breaks, are skipped. The URL-safe characters - and _ are accepted, trailing = padding is optional, and decoding stops at the first =.',
    'Decoded bytes are shown as UTF-8 text, and bytes that are not valid UTF-8 become the replacement character (U+FFFD). The tool is meant for text, not binary files such as images.',
    'Conversion runs in your browser using the buffer library. Neither the tool code nor that library makes network requests, so your text is not sent to a server.'
  ],
  faq: [
    {
      question: 'Can it decode URL-safe Base64?',
      answer:
        'Yes. When decoding, - and _ are read as + and /, and missing = padding is accepted. Encoding always outputs standard Base64 with + and / and = padding.'
    },
    {
      question: 'Can I encode an image or another binary file?',
      answer:
        'No. Select files reads the file as text, and decoded output is shown as UTF-8 text, so binary data is not preserved. Use this tool for text.'
    },
    {
      question: 'What happens if the Base64 input is invalid?',
      answer:
        'You get no error message. Characters outside the Base64 alphabet are skipped and decoding stops at the first =, so badly formed input produces garbled or empty text instead of an error. If the result looks wrong, check the input.'
    }
  ]
};

export default content;
