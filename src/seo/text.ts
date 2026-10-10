import { LIMITS } from './config';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Escapes text for use in HTML text nodes and double-quoted attributes. */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/**
 * Serializes JSON-LD so it can be embedded in a <script> element: `<`, `>`
 * and `&` are written as unicode escapes, which keeps `</script>` and HTML
 * comments inert while remaining valid JSON.
 */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const ABBREVIATIONS = new Set([
  'e.g',
  'i.e',
  'etc',
  'vs',
  'approx',
  'mr',
  'mrs',
  'dr',
  'no',
  'fig'
]);

/**
 * Splits text into sentences. A boundary is `.`, `!` or `?` followed by
 * whitespace and an uppercase letter, digit or quote, except after common
 * abbreviations such as "e.g." so that a sentence is never cut mid-way.
 */
export const splitSentences = (value: string): string[] => {
  const text = normalizeWhitespace(value);
  const sentences: string[] = [];
  const boundary = /[.!?]["')\]]?\s+(?=["'(\p{Lu}\p{N}])/gu;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text)) !== null) {
    const end = match.index + match[0].trimEnd().length;
    const previousWord = text
      .slice(start, match.index)
      .split(' ')
      .pop()
      ?.toLowerCase();
    if (previousWord && ABBREVIATIONS.has(previousWord)) continue;
    sentences.push(text.slice(start, end));
    start = match.index + match[0].length;
  }
  if (start < text.length) sentences.push(text.slice(start));
  return sentences.filter(Boolean);
};

/** Adds a final period when the text does not already end a sentence. */
export const ensureSentence = (value: string): string => {
  const text = normalizeWhitespace(value);
  if (!text) return '';
  return /[.!?]["')\]]?$/.test(text) ? text : `${text}.`;
};

/** Longest run of leading whole sentences that fits within `max` characters. */
export const leadingSentences = (value: string, max: number): string => {
  let result = '';
  for (const sentence of splitSentences(value)) {
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > max) break;
    result = next;
  }
  return result;
};

const withinDescriptionLimits = (value: string): boolean =>
  value.length >= LIMITS.descriptionMin &&
  value.length <= LIMITS.descriptionMax;

/**
 * Builds a meta description from whole sentences without truncating any of
 * them. Candidates are tried in order; a candidate that is too short is
 * completed with the first suffix sentence (longest first) that brings it
 * within the project limits. Returns null when no combination fits.
 */
export const composeDescription = (
  candidates: string[],
  suffixes: string[]
): string | null => {
  const sortedSuffixes = [...suffixes].sort((a, b) => b.length - a.length);
  for (const candidate of candidates) {
    const sentence = ensureSentence(candidate);
    if (!sentence) continue;
    const base =
      sentence.length <= LIMITS.descriptionMax
        ? sentence
        : leadingSentences(sentence, LIMITS.descriptionMax);
    if (!base) continue;
    if (withinDescriptionLimits(base)) return base;
    for (const suffix of sortedSuffixes) {
      const composed = `${base} ${suffix}`;
      if (withinDescriptionLimits(composed)) return composed;
    }
  }
  return null;
};

/** First candidate within the title limit, or null. */
export const composeTitle = (candidates: string[]): string | null =>
  candidates
    .map(normalizeWhitespace)
    .find((title) => title.length > 0 && title.length <= LIMITS.titleMax) ??
  null;

/**
 * Derives the subject of a category from its title, e.g. "Text Tools" ->
 * { title: "Text", lower: "text" } and "PDF Tools" -> { title: "PDF", lower: "PDF" }.
 */
export const categorySubject = (
  categoryTitle: string
): { title: string; lower: string } | null => {
  const match = /^(.+?)\s+Tools$/.exec(normalizeWhitespace(categoryTitle));
  if (!match) return null;
  const title = match[1];
  const lower = /^[\p{Lu}\p{N}]{2,}$/u.test(title)
    ? title
    : title.toLowerCase();
  return { title, lower };
};
