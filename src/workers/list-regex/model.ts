export const LIST_LIMITS = {
  inputBytes: 16 * 1024,
  patternBytes: 2 * 1024,
  joinBytes: 256,
  outputBytes: 512 * 1024,
  timeoutMs: 1000
} as const;
export type ListOperation = 'shuffle' | 'reverse';
export interface ListRequest {
  operation: ListOperation;
  input: string;
  options: {
    splitOperatorType: 'regex';
    splitSeparator: string;
    joinSeparator: string;
    length?: string;
  };
}
const bytes = (value: string) => new TextEncoder().encode(value).length;
export function checkRequest(request: ListRequest) {
  if (!['shuffle', 'reverse'].includes(request.operation))
    throw new Error('Unsupported list operation.');
  if (request.options.splitOperatorType !== 'regex')
    throw new Error('The worker requires regex split mode.');
  for (const [value, limit, label] of [
    [request.input, LIST_LIMITS.inputBytes, 'Input'],
    [request.options.splitSeparator, LIST_LIMITS.patternBytes, 'Pattern'],
    [request.options.joinSeparator, LIST_LIMITS.joinBytes, 'Output separator']
  ] as const) {
    if (
      typeof value !== 'string' ||
      value.length > limit ||
      bytes(value) > limit
    )
      throw new Error(`${label} exceeds the ${limit} byte regex-mode limit.`);
  }
  if (
    request.options.length !== undefined &&
    (typeof request.options.length !== 'string' ||
      request.options.length.length > 64)
  )
    throw new Error('Invalid output length.');
  // Preflight estimate rejects obviously expansive configurations. This is
  // not a hard memory quota: lookaround can produce overlapping captures.
  // Count all opening parentheses, even non-capturing or escaped ones: this
  // never underestimates capture count and does not compile on the UI thread.
  const groups = request.options.splitSeparator.split('(').length - 1;
  const parts = (request.input.length + 1) * (groups + 1) + 1;
  if (
    parts > 65536 ||
    request.input.length * (groups + 1) +
      parts * request.options.joinSeparator.length >
      LIST_LIMITS.outputBytes
  )
    throw new Error(
      'Potential split output is too large. Shorten the input, pattern or output separator.'
    );
}
export function checkOutput(result: unknown): asserts result is string {
  if (
    typeof result !== 'string' ||
    result.length > LIST_LIMITS.outputBytes ||
    bytes(result) > LIST_LIMITS.outputBytes
  )
    throw new Error('List output exceeds the 512 KiB limit.');
}
