/**
 * SEO content for /json/minify. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/json/minify/service.ts lines 8-19
 * - src/utils/json.ts lines 28-70
 * - src/pages/tools/json/minify/index.tsx lines 57-69
 * - src/pages/tools/json/minify/index.tsx lines 55, 62, 82-88; src/components/result/ToolCodeResult.tsx lines 18, 40-56; src/components/result/ResultFooter.tsx
 * - Verified with Node.js: JSON.stringify(JSON.parse('{"s":"\u00e9 \/ x","n":1.0,"e":1e2}')) -> {"s":"é / x","n":1,"e":100}; parseJsonInput('{ "a" : 1 }\n\n{ "b" : [ 1, 2 ] }') -> jsonl [{"a":1},{"b":[1,2]}]
 * - ECMAScript JSON.parse/stringify behavior as used in src/pages/tools/json/minify/service.ts; verified with Node v22
 * - src/pages/tools/json/minify/index.tsx lines 15-27
 * - public/locales/en/json.json minify.inputTitle/resultTitle; public/locales/en/translation.json inputFooter.importFromFile; src/components/ToolContent.tsx lines 26-33
 * - node_modules/@monaco-editor/loader/lib/es/config/index.js lines 1-5; node_modules/@monaco-editor/loader/lib/es/loader/index.js line 114
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JSON Minifier - Remove Whitespace from JSON | Orvulix',
  description:
    'Minify JSON by removing spaces, line breaks and indentation outside strings. JSON Lines input keeps one record per line. Copy or download the result.',
  howTo: [
    'Paste JSON or JSON Lines into the Input JSON editor, or click Select files to load a file.',
    'Read the compact output in the Minified JSON panel; it is produced automatically whenever the input changes.',
    'If the panel shows an error message instead, correct the reported problem in the input.',
    'Click Copy to clipboard, or Download to save the output as a .json file (.jsonl for JSON Lines input).'
  ],
  examples: [
    {
      title: 'Simple object',
      description:
        'Input: an object written over several lines containing "name": "John Doe", "age": 30 and "city": "New York". Output: {"name":"John Doe","age":30,"city":"New York"}.'
    },
    {
      title: 'JSON Lines',
      description:
        'Input: { "a" : 1 } on one line, a blank line, then { "b" : [ 1, 2 ] }. Output: {"a":1} and {"b":[1,2]} on two lines, with the blank line removed.'
    }
  ],
  notes: [
    'Standard JSON is parsed with JSON.parse and written back with JSON.stringify. This removes all whitespace between tokens. String values keep their content, but escape sequences such as \\u00e9 or \\/ are written out as plain characters.',
    'If the input is not a single JSON document but every non-blank line is valid JSON, it is treated as JSON Lines. Each record is minified onto its own line and blank lines are dropped.',
    'Values are re-serialized by JavaScript. Integers larger than 9007199254740991 can lose precision, numbers are rewritten in JavaScript form (1.0 becomes 1, 1e2 becomes 100), and if a key appears twice in the same object only its last value is kept.',
    'Invalid input is not minified. The Minified JSON panel shows the parser error instead, starting with Invalid JSON, or with Invalid JSON at line N when the input has more than one non-blank line.',
    'The input and output editors use the Monaco code editor. The page downloads it from cdn.jsdelivr.net when an editor loads.'
  ],
  faq: [
    {
      question: 'Is whitespace inside string values removed?',
      answer:
        'No. Only whitespace between JSON tokens is removed. A value such as "keep   these  spaces" keeps its spaces.'
    },
    {
      question: 'Can I minify an NDJSON or JSON Lines file?',
      answer:
        'Yes. If every non-blank line is valid JSON, each record is minified on its own line, and Download saves the result with a .jsonl extension.'
    }
  ]
};

export default content;
