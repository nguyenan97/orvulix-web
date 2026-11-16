/** SEO contract: features/delimited-json/convert.ts and Result.tsx; recheck on parser changes. */
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
    'With Use Headers on, the first logical record provides unique keys and every later record becomes an object. With it off, every record becomes an array of values.',
    'Dynamic Types turns true and false (any letter case) into booleans, lowercase null into null, and unquoted numeric text into numbers. Quoted values, empty cells and unsafe integers stay strings. Turn it off to keep every value as a string.',
    'Quoted fields may contain line breaks and doubled quotes. Whitespace is preserved. Missing or extra fields, duplicate headers and malformed quotes produce an error and disable export.',
    'The separator is compared one character at a time, so it must be a single character. Typing \\t (a backslash and a t) is not treated as a tab. Records starting with the Comment Symbol outside quotes are skipped. An empty Comment Symbol disables comments. The output is a JSON array indented with 2 spaces.',
    'Input is limited to 1 Mi UTF-16 units, 20000 data records, 1024 columns and 2 Mi UTF-16 units of JSON output. Numeric conversion uses JavaScript number precision.',
    "The conversion runs as JavaScript in your browser. The tool's code does not send your CSV over the network."
  ],
  faq: [
    {
      question: 'What does Skip Empty Lines do?',
      answer:
        'With Skip Empty Lines on, records containing only unquoted whitespace or separators are ignored. Quoted empty cells are retained. With it off, empty records must match the expected column count.'
    },
    {
      question: 'What happens if a row has fewer values than the header?',
      answer:
        'The tool rejects missing or extra fields with an error instead of silently dropping data, regardless of Dynamic Types.'
    },
    {
      question: 'How do I keep leading zeros in IDs or zip codes?',
      answer:
        'Quote the value or turn off Dynamic Types. Unquoted 01234 becomes 1234 when Dynamic Types is on; an empty cell stays an empty string.'
    }
  ]
};

export default content;
