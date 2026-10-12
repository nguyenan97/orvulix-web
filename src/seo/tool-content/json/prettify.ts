/**
 * SEO content for /json/prettify. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/json/prettify/index.tsx lines 15-18, 122-163; public/locales/en/json.json prettify.indentation, useSpaces, useTabs, inputTitle, resultTitle
 * - src/pages/tools/json/prettify/service.ts lines 2-15
 * - src/pages/tools/json/prettify/index.tsx lines 114-116; src/components/ToolContent.tsx lines 26-33
 * - src/utils/string.ts updateNumberField (val === '' -> ''; numeric -> Number(val))
 * - Verified with Node.js: JSON.stringify({a:[1,2]},null,15) indents 10 spaces; JSON.parse/stringify of '{"n":1.0,"e":1e2}' gives {"n":1,"e":100}
 * - Node v22: JSON.parse('{"a":1,}') throws 'Expected double-quoted property name'
 * - src/components/input/ToolCodeInput.tsx lines 38-54, 122-129; src/components/input/InputFooter.tsx lines 21-28; src/components/result/ToolCodeResult.tsx lines 18, 40-56; src/components/result/ResultFooter.tsx; public/locales/en/translation.json inputFooter/resultFooter
 * - node_modules/@monaco-editor/loader/lib/es/config/index.js lines 1-5; node_modules/@monaco-editor/loader/lib/es/loader/index.js line 114; grep of src finds no loader.config; src/components/input/ToolCodeInput.tsx line 7; src/components/result/ToolCodeResult.tsx line 7
 * - src/pages/tools/json/prettify/index.tsx lines 20-107
 * - src/utils/json.ts lines 28-70; src/pages/tools/json/minify/service.ts line 9; src/pages/tools/json/validateJson/service.ts line 7; src/pages/tools/json/prettify/service.ts line 7
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JSON Formatter - Prettify with Spaces or Tabs | Orvulix',
  description:
    'Format minified or messy JSON into readable, indented text. Pick a number of spaces or tabs, then copy the result or download it as a .json file.',
  howTo: [
    'Paste your JSON into the Input JSON editor, or click Select files to load it from a file.',
    'Under Indentation, select Use Spaces and type the number of spaces per level (2 by default), or select Use Tabs.',
    'Check the formatted output in the Prettified JSON panel. It is regenerated whenever you change the input or the indentation, as long as the input is valid JSON.',
    'Click Copy to clipboard to copy the result, or Download to save it as a .json file.'
  ],
  examples: [
    {
      title: 'Array with four-space indentation',
      description:
        'Input: [ 1, 2,3 ] spread unevenly over several lines, with Use Spaces set to 4. Output: the array with 1, 2 and 3 each on its own line, indented by four spaces.'
    },
    {
      title: 'Minified object with two spaces',
      description:
        'Input: {"names":["jack","john","alex"],"hobbies":{"jack":["programming","rock climbing"]}}. With Use Spaces set to 2, every key and array item goes on its own line, with two spaces added for each nesting level.'
    },
    {
      title: 'Tab indentation',
      description:
        'Input: an object with extra spaces around keys and colons, such as {  "name":  "The Name of the Wind", "published"   : 2007 }. With Use Tabs selected, the extra spaces are removed and each key goes on its own line, indented by one tab per nesting level.'
    }
  ],
  notes: [
    "The input is parsed with JavaScript's JSON.parse. If it is not valid JSON, an Invalid JSON string error message appears and the output panel is not updated.",
    'The space count is passed to JSON.stringify, which uses at most 10 spaces per level. A count of 0 or an empty field gives compact output with no line breaks.',
    'Values are re-serialized by JavaScript. Integers larger than 9007199254740991 can lose precision, numbers are rewritten in JavaScript form (1.0 becomes 1, 1e2 becomes 100), and if a key appears twice in the same object only its last value is kept.',
    'The input and output editors use the Monaco code editor. The page downloads it from cdn.jsdelivr.net when an editor loads.'
  ],
  faq: [
    {
      question: 'Can it repair invalid JSON such as trailing commas?',
      answer:
        "No. It only re-indents text that JSON.parse accepts. Trailing commas, unquoted property names and comments trigger the Invalid JSON string error. To see the parser's exact message, use the Validate JSON tool."
    },
    {
      question: 'Can I format JSON Lines (NDJSON)?',
      answer:
        'Not with this tool. It parses the whole input as one JSON document, so several JSON values on separate lines fail to parse. The Minify JSON and Validate JSON tools accept JSON Lines input.'
    }
  ]
};

export default content;
