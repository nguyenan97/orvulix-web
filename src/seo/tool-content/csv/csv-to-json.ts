/**
 * SEO content for /csv/csv-to-json. Every statement was checked against the code;
 * re-verify these sources when upstream changes the tool:
 * - src/pages/tools/csv/csv-to-json/service.ts lines 24-37 and 100-103
 * - src/pages/tools/csv/csv-to-json/service.ts lines 44-62
 * - src/pages/tools/csv/csv-to-json/service.ts lines 54-57
 * - src/pages/tools/csv/csv-to-json/service.ts lines 39-41 and 64
 * - src/pages/tools/csv/csv-to-json/service.ts lines 67-87; src/components/options/TextFieldWithDesc.tsx (value passed through unchanged)
 * - src/pages/tools/csv/csv-to-json/service.ts lines 89-98
 * - src/pages/tools/csv/csv-to-json/service.ts lines 55-56 and 89-92; src/pages/tools/csv/csv-to-json/index.tsx lines 132-139
 * - src/pages/tools/csv/csv-to-json/index.tsx lines 24-33
 * - src/pages/tools/csv/csv-to-json/index.tsx lines 152-214; public/locales/en/csv.json lines 13-37
 * - src/components/input/ToolTextInput.tsx lines 31-43 and 67; src/components/input/InputFooter.tsx line 22; src/pages/tools/csv/csv-to-json/index.tsx lines 160-164; src/components/result/ToolTextResult.tsx lines 26-50
 * - src/components/ToolContent.tsx lines 26-33; src/pages/tools/csv/csv-to-json/service.ts (no imports); src/components/input/ToolTextInput.tsx; src/components/result/ToolTextResult.tsx; grep of src and index.html for fetch/XMLHttpRequest/sendBeacon/analytics
 * - src/pages/tools/csv/csv-to-json/index.tsx lines 35-78; service.ts lines 44-64 and 89-98
 */
import type { ToolSeoOverride } from '../../types';

const content: ToolSeoOverride = {
  title: 'CSV to JSON Converter with Type Detection | Orvulix',
  description:
    'Convert CSV to a JSON array. Set the separator, quote and comment characters, use the first row as keys, and turn numbers and booleans into JSON types.',
  howTo: [
    'Paste your CSV into the Input CSV box, or click Select files to load it from a file.',
    'Under Input CSV Format, set the Column Separator, Field Quote and Comment Symbol. The defaults are a comma, a double quote and #.',
    'Under Conversion Options, check or uncheck Use Headers, Skip Empty Lines and Dynamic Types. All three are on by default.',
    'The Output JSON updates as you type. Click Copy to clipboard, or click Download to save it as a .json file.'
  ],
  examples: [
    {
      title: 'CSV with a header row',
      description:
        'name,age,city followed by John,30,New York produces [{"name": "John", "age": 30, "city": "New York"}].'
    },
    {
      title: 'Semicolon-separated values',
      description:
        'With Column Separator set to ; the lines product;price and Apple;1.99 produce [{"product": "Apple", "price": 1.99}].'
    },
    {
      title: 'No header row',
      description:
        'With Use Headers off, the lines 1,2 and 3,4 produce [[1, 2], [3, 4]]: each line becomes an array of values.'
    }
  ],
  notes: [
    'With Use Headers on, the first line that is not blank or a comment provides the keys and every later line becomes an object. With it off, every line becomes an array of values.',
    'Dynamic Types turns true and false (any letter case) into booleans, lowercase null into null, and numeric text into numbers. 007 becomes 7 and an empty cell becomes 0. Turn it off to keep every value as a string.',
    'The input is split at line breaks, so a quoted field cannot span several lines. Quote characters are removed from values, a doubled quote inside a field is not kept as a literal quote, and spaces around each value are trimmed.',
    'The separator is compared one character at a time, so it must be a single character. Typing \\t (a backslash and a t) is not treated as a tab. Lines whose first non-space character is the Comment Symbol are skipped. The output is a JSON array indented with 2 spaces.',
    "The conversion runs as JavaScript in your browser. The tool's code does not send your CSV over the network."
  ],
  faq: [
    {
      question: 'What does Skip Empty Lines do?',
      answer:
        'Completely blank lines are always ignored. With Skip Empty Lines on, lines that contain only separators and spaces (such as ,,) are ignored too. With it off, such a line becomes a record with empty values, or 0s when Dynamic Types is on.'
    },
    {
      question: 'What happens if a row has fewer values than the header?',
      answer:
        "With Dynamic Types on, the tool shows an error instead of JSON. With it off, the missing keys are left out of that row's object. Values beyond the number of headers are dropped in both cases."
    },
    {
      question: 'How do I keep leading zeros in IDs or zip codes?',
      answer:
        'Turn off Dynamic Types. When it is on, numeric text is converted to a number, so 01234 becomes 1234 and an empty cell becomes 0.'
    }
  ]
};

export default content;
