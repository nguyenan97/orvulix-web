/**
 * SEO content for /json/json-comparison. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/json/json-comparison/index.tsx lines 18-42, 61-84
 * - src/pages/tools/json/json-comparison/service.ts lines 63-120
 * - src/pages/tools/json/json-comparison/service.ts lines 1-19
 * - src/pages/tools/json/json-comparison/service.ts lines 51-61; src/pages/tools/json/json-comparison/index.tsx lines 32-38
 * - src/pages/tools/json/json-comparison/service.test.ts lines 4-49
 * - Ran a copy of src/pages/tools/json/json-comparison/service.ts with node --experimental-strip-types in the
 * - src/components/input/ToolCodeInput.tsx lines 38-54, 122; src/components/result/ToolTextResult.tsx lines 14, 26-50, 85; public/locales/en/translation.json inputFooter/resultFooter
 * - node_modules/@monaco-editor/loader/lib/es/config/index.js lines 1-5; node_modules/@monaco-editor/loader/lib/es/loader/index.js line 114; src/pages/tools/json/json-comparison/index.tsx line 79
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JSON Diff - Compare Two JSON Objects | Orvulix',
  description:
    'Compare two JSON documents and list each missing key and changed value by its path, such as person.name. The differences update as you edit either side.',
  howTo: [
    'Paste the first document into the First JSON editor.',
    'Paste the document to compare into the Second JSON editor. You can also load either side with Select files.',
    'Read the Differences box. It updates after each edit and lists one difference per line, or shows No differences found when the documents match.',
    'Click Copy to clipboard, or Download to save the differences as a .txt file.'
  ],
  examples: [
    {
      title: 'Missing key',
      description:
        'First JSON: {"name": "John", "age": 30}. Second JSON: {"name": "John"}. Differences: age: Missing in second JSON.'
    },
    {
      title: 'Changed nested value',
      description:
        'First JSON: {"person": {"name": "John", "age": 30}}. Second JSON: {"person": {"name": "Jane", "age": 30}}. Differences: person.name: Mismatch: John != Jane.'
    },
    {
      title: 'Changed array item',
      description:
        'First JSON: {"numbers": [1, 2, 3]}. Second JSON: {"numbers": [1, 2, 4]}. Differences: numbers.2: Mismatch: 3 != 4.'
    }
  ],
  notes: [
    'Nested objects and arrays are compared recursively. Each difference is labeled with a dot-separated path, and array positions appear as numbers, as in numbers.2. The top level should be an object or array: two different bare values such as 1 and 2 give No differences found.',
    'Array items are compared by position, so the same items in a different order are reported as mismatches.',
    'Values are compared with strict equality and printed without quotes, so the number 1 and the string "1" show up as a mismatch that reads 1 != 1.',
    'A comma followed only by whitespace and a closing } or ] is removed before parsing, so trailing commas do not cause an error. This also happens inside string values, so "x,]" and "x]" compare as equal. An empty editor is treated as {}.',
    'The two input editors use the Monaco code editor. The page downloads it from cdn.jsdelivr.net when an editor loads.'
  ],
  faq: [
    {
      question: 'Does the order of keys matter?',
      answer:
        'No. Each key is looked up by name in the other object, so {"a":1,"b":2} and {"b":2,"a":1} give No differences found. The order of array items does matter.'
    },
    {
      question:
        'What do Missing in first JSON and Missing in second JSON mean?',
      answer:
        'The key exists in only one document. Missing in second JSON means the key is in First JSON but not in Second JSON, and Missing in first JSON means the reverse.'
    },
    {
      question: 'What happens if one of the inputs is not valid JSON?',
      answer:
        "No comparison is made. The Differences box shows Error: followed by First JSON or Second JSON and the parser's message for each input that failed to parse."
    }
  ]
};

export default content;
