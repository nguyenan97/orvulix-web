import type { InitialValuesType } from '../../pages/tools/string/text-replacer/initialValues';
export type SplitOptions = {
  splitSeparatorType: 'symbol' | 'regex' | 'length' | 'chunks';
  symbolValue: string;
  regexValue: string;
  lengthValue: string;
  chunksValue: string;
  outputSeparator: string;
  charBeforeChunk: string;
  charAfterChunk: string;
};
export type PalindromeOptions = {
  splitOperatorType: 'symbol' | 'regex';
  symbolValue: string;
  regexValue: string;
};
export type StringRequest =
  | { tool: 'replace'; input: string; options: InitialValuesType }
  | { tool: 'split'; input: string; options: SplitOptions }
  | { tool: 'palindrome'; input: string; options: PalindromeOptions };
export const OUTPUT_LIMIT = 1024 * 1024;
function text(
  value: unknown,
  limit: number,
  label: string
): asserts value is string {
  if (typeof value !== 'string' || value.length > limit)
    throw new Error(`${label} exceeds its ${limit} UTF-16 unit limit.`);
}
function budget(units: number) {
  if (!Number.isFinite(units) || units > OUTPUT_LIMIT)
    throw new Error(
      'Potential output exceeds the 1 Mi UTF-16 unit limit. Shorten input, captures or output decorations.'
    );
}
function splitBudget(input: string, separator: string, regex: boolean) {
  const groups = regex ? separator.split('(').length - 1 : 0;
  const parts = regex
    ? (input.length + 1) * (groups + 1) + 1
    : input.split(separator, 20001).length;
  if (parts > 20000)
    throw new Error('Potential split exceeds the 20000 part limit.');
  const units =
    regex && groups && separator.includes('(?')
      ? parts * input.length
      : input.length * (groups + 1);
  return { parts, units };
}

/** Admission only: never compile or execute an arbitrary pattern on the UI thread. */
export function checkRequest(request: StringRequest) {
  if (!request || !request.options || typeof request.options !== 'object')
    throw new Error('Invalid string processing request.');
  text(request.input, 65536, 'Input');
  const { input } = request;
  if (request.tool === 'replace') {
    const options = request.options;
    if (!['text', 'regexp'].includes(options.mode))
      throw new Error('Invalid replacement mode.');
    text(options.searchValue, 1024, 'Search text');
    text(options.searchRegexp, 1024, 'Pattern');
    text(options.replaceValue, 4096, 'Replacement');
    const search =
      options.mode === 'text' ? options.searchValue : options.searchRegexp;
    if (!input.trim() || !search.trim()) return;
    const literal = options.searchRegexp.match(/^\/(.*)\/([a-z]*)$/i);
    const matches =
      options.mode === 'regexp' && literal && !literal[2].includes('g')
        ? 1
        : input.length + 1;
    const substitutions =
      options.replaceValue.match(
        options.mode === 'regexp'
          ? /\$(?:&|`|'|[0-9]{1,2}|<[^>]*>)/g
          : /\$(?:&|`|')/g
      )?.length ?? 0;
    budget(
      input.length +
        matches * (options.replaceValue.length + substitutions * input.length)
    );
    return;
  }
  if (request.tool === 'split') {
    const options = request.options;
    for (const [label, value] of Object.entries(options))
      text(value, 1024, label);
    if (
      !['symbol', 'regex', 'length', 'chunks'].includes(
        options.splitSeparatorType
      )
    )
      throw new Error('Invalid split mode.');
    let parts: number,
      units = input.length;
    if (
      options.splitSeparatorType === 'length' ||
      options.splitSeparatorType === 'chunks'
    ) {
      const count = Number(
        options.splitSeparatorType === 'length'
          ? options.lengthValue
          : options.chunksValue
      );
      if (!Number.isInteger(count) || count < 1)
        throw new Error('Length/chunks must be a positive integer.');
      parts =
        options.splitSeparatorType === 'length'
          ? Math.ceil(input.length / count)
          : count;
      if (parts > 20000) throw new Error('Split exceeds the 20000 part limit.');
      if (options.splitSeparatorType === 'chunks')
        units +=
          parts *
          (options.charBeforeChunk.length + options.charAfterChunk.length);
    } else
      ({ parts, units } = splitBudget(
        input,
        options.splitSeparatorType === 'regex'
          ? options.regexValue
          : options.symbolValue,
        options.splitSeparatorType === 'regex'
      ));
    budget(units + Math.max(0, parts - 1) * options.outputSeparator.length);
    return;
  }
  if (request.tool === 'palindrome') {
    const options = request.options;
    if (!['symbol', 'regex'].includes(options.splitOperatorType))
      throw new Error('Invalid palindrome split mode.');
    text(options.symbolValue, 1024, 'Separator');
    text(options.regexValue, 1024, 'Pattern');
    const separator =
      options.splitOperatorType === 'regex'
        ? options.regexValue
        : options.symbolValue;
    const { parts, units } = splitBudget(
      input,
      separator,
      options.splitOperatorType === 'regex'
    );
    budget(units);
    budget(parts * 5 + Math.max(0, parts - 1) * separator.length);
    return;
  }
  throw new Error('Unsupported string operation.');
}

export function checkOutput(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.length > OUTPUT_LIMIT)
    throw new Error('String output exceeds the 1 Mi UTF-16 unit limit.');
}
