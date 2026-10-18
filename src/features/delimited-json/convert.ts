export type DelimitedOptions = {
  delimiter: string;
  quote: string;
  comment: string;
  useHeaders: boolean;
  skipEmptyLines: boolean;
  dynamicTypes: boolean;
  indentationType?: 'space' | 'tab' | 'none';
  spacesCount?: number;
};

type Cell = { value: string; quoted: boolean };
type Value = string | number | boolean | null;
const OUTPUT_LIMIT = 2 * 1024 * 1024;

function typedValue(cell: Cell, dynamic: boolean): Value {
  const value = cell.value;
  if (!dynamic || cell.quoted || !value.trim()) return value;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (value === 'null') return null;
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
    const number = Number(value);
    if (
      Number.isFinite(number) &&
      (!Number.isInteger(number) || Number.isSafeInteger(number))
    )
      return number;
  }
  return value;
}

/** Parse logical records once; quoted content never passes through line filtering. */
export function convertDelimited(
  source: string,
  options: DelimitedOptions
): string {
  if (source.length > 1024 * 1024)
    throw new Error('Input limit is 1 Mi UTF-16 units.');
  const { delimiter, quote, comment } = options;
  if (delimiter.length !== 1 || /[\r\n]/.test(delimiter))
    throw new Error('Delimiter must be one non-newline character.');
  if (quote.length > 1 || /[\r\n]/.test(quote) || quote === delimiter)
    throw new Error(
      'Quote must be empty or one distinct non-newline character.'
    );
  if (/[\r\n]/.test(comment))
    throw new Error('Comment marker cannot contain a newline.');
  const indent =
    options.indentationType === 'none'
      ? undefined
      : options.indentationType === 'tab'
        ? '\t'
        : options.spacesCount ?? 2;
  const rows: (Value[] | Record<string, Value>)[] = [];
  let headers: string[] | undefined;
  let width: number | undefined;
  let outputUnits = 2;
  let fields: Cell[] = [];
  let value = '';
  let quoted = false;
  let state: 'plain' | 'quoted' | 'closed' = 'plain';
  let recordStart = true;
  const field = () => {
    fields.push({ value, quoted });
    if (fields.length > 1024)
      throw new Error('Column limit is 1024 fields per record.');
    value = '';
    quoted = false;
    state = 'plain';
  };
  const record = () => {
    field();
    const cells = fields;
    fields = [];
    recordStart = true;
    if (
      options.skipEmptyLines &&
      cells.every((cell) => !cell.quoted && !cell.value.trim())
    )
      return;
    if (width === undefined) width = cells.length;
    if (cells.length !== width)
      throw new Error(
        `Record ${rows.length + 1} has ${
          cells.length
        } fields; expected ${width}.`
      );
    if (options.useHeaders && !headers) {
      headers = cells.map((cell) => cell.value);
      if (new Set(headers).size !== headers.length)
        throw new Error('Duplicate headers are not allowed.');
      return;
    }
    if (rows.length >= 20000)
      throw new Error('Data record limit is 20000 rows.');
    const values = cells.map((cell) => typedValue(cell, options.dynamicTypes));
    let row: Value[] | Record<string, Value> = values;
    if (headers) {
      const object: Record<string, Value> = Object.create(null);
      headers.forEach((header, index) => {
        object[header] = values[index];
      });
      row = object;
    }
    // Serialize one bounded row before retaining it, including repeated header costs.
    outputUnits += JSON.stringify(row, null, indent).length + 1;
    if (outputUnits > OUTPUT_LIMIT)
      throw new Error('JSON output limit is 2 Mi UTF-16 units.');
    rows.push(row);
  };
  for (let i = 0; i < source.length; i++) {
    if (recordStart && comment) {
      let cursor = i;
      while (
        source[cursor] === ' ' ||
        (source[cursor] === '\t' && delimiter !== '\t')
      )
        cursor++;
      if (source.startsWith(comment, cursor)) {
        while (i < source.length && source[i] !== '\r' && source[i] !== '\n')
          i++;
        if (source[i] === '\r' && source[i + 1] === '\n') i++;
        continue;
      }
    }
    recordStart = false;
    const char = source[i];
    if (state === 'quoted') {
      if (char === quote) {
        if (source[i + 1] === quote) {
          value += quote;
          i++;
        } else state = 'closed';
      } else value += char;
    } else if (char === delimiter) field();
    else if (char === '\r' || char === '\n') {
      record();
      if (char === '\r' && source[i + 1] === '\n') i++;
    } else if (state === 'closed')
      throw new Error('Unexpected text after closing quote in field.');
    else if (quote && char === quote) {
      if (value)
        throw new Error('Quote must start at the beginning of a field.');
      quoted = true;
      state = 'quoted';
    } else value += char;
  }
  if (state === 'quoted') throw new Error('Unclosed quoted field.');
  if (!recordStart) record();
  const result = JSON.stringify(rows, null, indent);
  if (result.length > OUTPUT_LIMIT)
    throw new Error('JSON output limit is 2 Mi UTF-16 units.');
  return result;
}
