import { PAGINATION_LIMITS } from './pagination';

export const RANGE_LIMITS = { inputBytes: 128, tokens: 16 } as const;
export type PageSelection =
  | { mode: 'all' }
  | { mode: 'custom'; expression: string };
export const ALL_PAGES: PageSelection = { mode: 'all' };

/** Bounded syntax only: no expansion based on an unchecked endpoint. */
export function parsePageRanges(expression: string): number[] {
  if (
    typeof expression !== 'string' ||
    expression.length > RANGE_LIMITS.inputBytes ||
    new TextEncoder().encode(expression).length > RANGE_LIMITS.inputBytes
  )
    throw Error('Page ranges must be at most 128 UTF-8 bytes.');
  if (!expression.trim())
    throw Error('Enter custom page ranges, such as 1,3,5-7.');
  const tokens = expression.split(',');
  if (tokens.length > RANGE_LIMITS.tokens)
    throw Error('Page ranges must have at most 16 tokens.');
  const pages = new Set<number>();
  for (const token of tokens) {
    const match = token.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match)
      throw Error(
        'Invalid page range. Use positive integers and inclusive ranges, such as 1,3,5-7.'
      );
    const first = Number(match[1]),
      last = Number(match[2] ?? match[1]);
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(last) ||
      first < 1 ||
      last > PAGINATION_LIMITS.pages ||
      last < first
    )
      throw Error('Page numbers must be 1-8 and ranges must be increasing.');
    for (let page = first; page <= last; page++) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}
export function selectedSourcePages(
  selection: PageSelection,
  total: number
): number[] {
  if (!Number.isInteger(total) || total < 1 || total > PAGINATION_LIMITS.pages)
    throw Error('Invalid source document page count.');
  if (selection.mode === 'all')
    return Array.from({ length: total }, (_, i) => i + 1);
  if (selection.mode !== 'custom')
    throw Error('Unsupported page selection mode.');
  const pages = parsePageRanges(selection.expression);
  if (pages.some((page) => page > total))
    throw Error(
      `Page range is outside the ${total}-page source document. Choose pages 1-${total}.`
    );
  return pages;
}
