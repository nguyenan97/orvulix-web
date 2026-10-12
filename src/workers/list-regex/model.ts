import { LIST_LIMITS } from './limits';
export { LIST_LIMITS } from './limits';
export type { ListRequest, ListOperation } from './contracts';
import type { ListRequest } from './contracts';
import { OPERATIONS } from './request';
const bytes = (value: string) => new TextEncoder().encode(value).length;
export function checkRequest(request: ListRequest) {
  if (!OPERATIONS.includes(request.operation))
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
    'length' in request.options &&
    request.options.length !== undefined &&
    (typeof request.options.length !== 'string' ||
      request.options.length.length > 64)
  )
    throw new Error('Invalid output length.');
  for (const [key, value] of Object.entries(request.options)) {
    if (
      typeof value === 'string' &&
      (value.length > LIST_LIMITS.patternBytes ||
        bytes(value) > LIST_LIMITS.patternBytes)
    )
      throw new Error(`${key} exceeds the option byte limit.`);
  }
  if (
    request.operation === 'group' &&
    (!Number.isInteger(request.options.groupNumber) ||
      request.options.groupNumber < 1 ||
      request.options.groupNumber > LIST_LIMITS.groupSize)
  )
    throw new Error('Group size must be an integer from 1 to 4096.');
  if (request.operation === 'duplicate') {
    const copies = parseFloat(request.options.copy);
    if (!Number.isFinite(copies) || copies <= 0 || copies > LIST_LIMITS.copies)
      throw new Error('Copies must be positive, finite and at most 1000.');
    if (
      (request.input.length + 1) *
        (request.options.splitSeparator.split('(').length +
          request.options.joinSeparator.length +
          1) *
        Math.ceil(copies) >
      LIST_LIMITS.outputBytes
    )
      throw new Error('Potential duplicate output is too large.');
  }
  // Preflight estimate rejects obviously expansive configurations. This is
  // not a hard memory quota: lookaround can produce overlapping captures.
  // Count all opening parentheses, even non-capturing or escaped ones: this
  // never underestimates capture count and does not compile on the UI thread.
  const groups = request.options.splitSeparator.split('(').length - 1;
  const parts = (request.input.length + 1) * (groups + 1) + 1;
  let decoration = parts * request.options.joinSeparator.length;
  if (request.operation === 'wrap')
    decoration +=
      parts * (request.options.left.length + request.options.right.length);
  if (request.operation === 'group')
    decoration +=
      parts *
        (request.options.leftWrap.length +
          request.options.rightWrap.length +
          request.options.itemSeparator.length) +
      (request.options.padNonFullGroup
        ? request.options.groupNumber *
          (request.options.paddingChar.length +
            request.options.itemSeparator.length)
        : 0);
  if (request.operation === 'find-most-popular') decoration += parts * 32;
  if (
    parts > 65536 ||
    request.input.length * (groups + 1) + decoration > LIST_LIMITS.outputBytes
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
