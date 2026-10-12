/**
 * SEO content for /json/validateJson. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/json/validateJson/service.ts lines 3-15; src/pages/tools/json/validateJson/index.tsx lines 56-67; public/locales/en/json.json validateJson.validJson and invalidJson
 * - src/utils/json.ts lines 28-70
 * - Ran a copy of src/utils/json.ts with node --experimental-strip-types: '{\n  "name": "John",\n  "age": 30,\n}' -> 'Invalid JSON at line 1: Expected property name or '}' ...'; '{ "a" : 1 }\n\n{ "b" : [ 1, 2 ] }' -> jsonl OK; '42' -> OK; '{"a":1,}' -> 'Invalid JSON: Expected double-quoted property name ...'; '// c\n{"a":1}' -> error
 * - src/utils/json.ts lines 46-50, 59-64; src/pages/tools/json/validateJson/service.ts lines 10-11
 * - src/pages/tools/json/validateJson/service.ts (only calls parseJsonInput)
 * - src/components/ToolContent.tsx lines 26-33; src/components/examples/ToolExamples.tsx changeInputResult; src/components/examples/ExampleCard.tsx lines 37-38; src/pages/tools/json/validateJson/index.tsx lines 11-48
 * - public/locales/en/json.json validateJson.inputTitle/resultTitle; public/locales/en/translation.json inputFooter.importFromFile; src/components/input/ToolCodeInput.tsx lines 38-54, 122
 * - node_modules/@monaco-editor/loader/lib/es/config/index.js lines 1-5; node_modules/@monaco-editor/loader/lib/es/loader/index.js line 114; src/pages/tools/json/validateJson/index.tsx line 81 (ToolTextResult)
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JSON Validator for JSON and JSON Lines | Orvulix',
  description:
    "Check whether JSON or JSON Lines text parses correctly. Paste or import your data to see Valid JSON or the parser's error message as you edit.",
  howTo: [
    'Paste your JSON into the Input JSON editor, or click Select files to load it from a file.',
    'Read the Validation Result box. It shows Valid JSON with a check mark, or a cross mark followed by the error message.',
    'Fix the reported problem in the editor; the input is checked again after every change.',
    'To try sample input, click one of the example cards below the tool to load it into the editor.'
  ],
  examples: [
    {
      title: 'Valid object',
      description:
        'Input: {"name": "John", "age": 30, "city": "New York"}. Result: Valid JSON.'
    },
    {
      title: 'Trailing comma',
      description:
        'Input: {"a":1,}. Result: an Invalid JSON message saying that a double-quoted property name was expected. The exact wording depends on the browser.'
    },
    {
      title: 'JSON Lines',
      description:
        'Input: {"a":1} on the first line and {"b":[1,2]} on the second. Result: Valid JSON, because each non-blank line is valid JSON on its own.'
    }
  ],
  notes: [
    "The whole input is first parsed with JavaScript's JSON.parse, so any single JSON value is valid, including a bare number such as 42. If that fails and the input has more than one non-blank line, each line is checked separately as JSON Lines.",
    'When a multi-line document fails both checks, the error names the first line that is not valid JSON on its own. For pretty-printed objects and arrays that is usually line 1, not necessarily the line with the mistake.',
    'Only syntax is checked. There is no JSON Schema validation and no check of field names or value types.',
    "Error messages come from the browser's built-in JSON parser, so the wording can differ between browsers.",
    'The input editor is the Monaco code editor. The page downloads it from cdn.jsdelivr.net when the editor loads.'
  ],
  faq: [
    {
      question: 'Does it accept JSON Lines or NDJSON?',
      answer:
        'Yes. If the input is not one JSON document but every non-blank line parses as JSON, the result is Valid JSON. Blank lines are ignored.'
    },
    {
      question:
        'Why does the error point to line 1 when the mistake is further down?',
      answer:
        "A multi-line input that is not valid JSON is re-checked line by line as JSON Lines. The error then names the first line that is not a complete JSON value. For a formatted object, that is the opening brace on line 1. With single-line input, you get the parser's own message instead."
    },
    {
      question: 'Are trailing commas or comments allowed?',
      answer:
        'No. The input is parsed with standard JSON.parse, which rejects trailing commas, unquoted property names and comments.'
    }
  ]
};

export default content;
