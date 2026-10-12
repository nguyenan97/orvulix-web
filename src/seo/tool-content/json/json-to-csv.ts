/**
 * SEO content for /json/json-to-csv. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/json/json-to-csv/service.ts lines 9-38
 * - src/pages/tools/json/json-to-csv/service.ts lines 43-55
 * - src/pages/tools/json/json-to-csv/service.ts line 85; src/pages/tools/json/json-to-csv/index.tsx lines 81-93
 * - src/pages/tools/json/json-to-csv/service.ts lines 14-22 and 89-93
 * - src/pages/tools/json/json-to-csv/service.ts lines 60-74 and 99-101
 * - src/pages/tools/json/json-to-csv/service.ts line 111
 * - src/utils/json.ts lines 81-106; src/pages/tools/json/json-to-csv/service.ts lines 103-109
 * - src/utils/json.ts lines 28-70
 * - src/pages/tools/json/json-to-csv/index.tsx lines 16-20 and 118-163; public/locales/en/json.json lines 17-41
 * - src/pages/tools/json/json-to-csv/index.tsx lines 104-109; src/components/input/ToolCodeInput.tsx lines 38-50, 102-122; src/components/input/InputFooter.tsx line 22; public/locales/en/translation.json line 118
 * - node_modules/@monaco-editor/loader/lib/es/config/index.js lines 1-5; node_modules/@monaco-editor/loader/lib/es/loader/index.js lines 105-120; no loader config in src (grep)
 * - src/components/ToolContent.tsx lines 26-33
 * - src/pages/tools/json/json-to-csv/index.tsx lines 112-116; src/components/result/ToolTextResult.tsx lines 26-50, 85; src/components/result/ResultFooter.tsx lines 24-39; public/locales/en/translation.json lines 186-187
 * - src/pages/tools/json/json-to-csv/service.ts lines 9-111; index.tsx example cards lines 37-72
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'JSON to CSV Converter with Nested Flattening | Orvulix',
  description:
    'Convert JSON or JSON Lines to CSV. Nested objects become dot-notation columns, arrays get indexed columns, and you choose the delimiter and quoting.',
  howTo: [
    'Paste your JSON into the Input JSON editor, or click Select files to load it from a file.',
    "In the Delimiter field, type the character that separates values. The default is a comma. If the field is empty, the output shows 'No CSV delimiter.'",
    'Under String Quoting, choose Auto (recommended) to quote only the cells that need it, or Always quote to wrap every cell in double quotes.',
    'Under Headers, keep Include header row checked to put the column names in the first row, or uncheck it to output data rows only.',
    'The Output CSV updates as you type. Click Copy to clipboard, or click Download to save it as a .csv file.'
  ],
  examples: [
    {
      title: 'Nested object to columns',
      description:
        '[{"id":1,"user":{"name":"Ana","tags":["a","b"]}}] produces the header id,user.name,user.tags[0],user.tags[1] and the row 1,Ana,a,b.'
    },
    {
      title: 'Rows with different keys',
      description:
        '[{"name":"Alice","age":30},{"name":"Bob","city":"Paris"}] produces name,age,city followed by Alice,30, and Bob,,Paris. Missing keys become empty cells.'
    },
    {
      title: 'JSON Lines with a semicolon delimiter',
      description:
        'With Delimiter set to ; the two lines {"a":1} and {"a":2,"b":"x;y"} produce a;b, then 1; and 2;"x;y". The last cell is quoted because it contains the delimiter.'
    }
  ],
  notes: [
    'Nested objects are flattened into dot-notation columns (address.city) and arrays into indexed columns (tags[0], tags[1]). Columns appear in the order their keys are first found.',
    "Input can be a single object, an array of objects, or JSON Lines (one JSON value per line). A bare value such as 42 is rejected, and an array of plain values such as [1,2,3] returns 'No data found in the provided JSON.'",
    'Missing keys and null values become empty cells. Rows are separated by CRLF line breaks, and double quotes inside a cell are escaped by doubling them.',
    'The JSON input editor (Monaco) is downloaded from cdn.jsdelivr.net when the editor loads. The conversion itself runs as JavaScript in the page.'
  ],
  faq: [
    {
      question: 'Can I convert JSON Lines (NDJSON)?',
      answer:
        'Yes. If the input is not a single valid JSON document and has more than one non-blank line, each non-blank line is parsed as its own JSON value and becomes one row. Blank lines are ignored, and a line that fails to parse is reported with its line number.'
    },
    {
      question: 'Which cells are quoted in Auto mode?',
      answer:
        'Only cells that contain the delimiter, a double quote, or a line break (CR or LF). Always quote wraps every cell in double quotes, including the header row.'
    },
    {
      question: "Why do I get 'No data found in the provided JSON.'?",
      answer:
        'This message appears when no row has any value to output. For example, every object is empty ({}), or the array holds plain values such as numbers or strings instead of objects.'
    }
  ]
};

export default content;
