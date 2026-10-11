export const REGEX_LIMITS = {
  textBytes: 16 * 1024,
  patternBytes: 2048,
  matches: 100,
  captures: 20,
  preview: 256,
  timeoutMs: 1000
} as const;
export interface RegexInput {
  pattern: string;
  flags: string;
  text: string;
}
export interface RegexMatch {
  start: number;
  end: number;
  captures: (string | null)[];
  groups: [string, string | null][];
}
export interface RegexResult {
  matches: RegexMatch[];
  truncated: boolean;
}

/** Bounds only: never compile or execute an untrusted expression on the UI thread. */
export function checkRegexInput(input: RegexInput) {
  const bytes = (value: string) => new TextEncoder().encode(value).length;
  if (!input.pattern)
    throw new Error('Enter a regex pattern without enclosing slashes.');
  if (bytes(input.pattern) > REGEX_LIMITS.patternBytes)
    throw new Error('Pattern exceeds the 2 KiB limit.');
  if (bytes(input.text) > REGEX_LIMITS.textBytes)
    throw new Error('Text exceeds the 16 KiB limit.');
  if (
    !/^[dgimsuvy]*$/.test(input.flags) ||
    new Set(input.flags).size !== input.flags.length ||
    (input.flags.includes('u') && input.flags.includes('v'))
  )
    throw new Error(
      'Use unique JavaScript flags: d, g, i, m, s, u, v, y. Flags u and v cannot be combined.'
    );
}

/** Called only in the disposable worker (or controlled unit-test fixtures). */
export function executeRegex(input: RegexInput): RegexResult {
  checkRegexInput(input);
  const regex = new RegExp(input.pattern, input.flags);
  const matches: RegexMatch[] = [];
  const preview = (value: string | undefined) =>
    value === undefined ? null : value.slice(0, REGEX_LIMITS.preview);
  const repeat = regex.global || regex.sticky;
  const unicode = input.flags.includes('u') || input.flags.includes('v');
  for (;;) {
    const match = regex.exec(input.text);
    if (!match) return { matches, truncated: false };
    if (matches.length === REGEX_LIMITS.matches)
      return { matches, truncated: true };
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      captures: match.slice(1, REGEX_LIMITS.captures + 1).map(preview),
      groups: Object.entries(match.groups ?? {})
        .slice(0, REGEX_LIMITS.captures)
        .map(([key, value]) => [key, preview(value)])
    });
    if (!repeat) return { matches, truncated: false };
    // Advance zero-width matches; Unicode mode must skip a whole surrogate pair.
    if (match[0] === '') {
      const index = regex.lastIndex;
      const first = input.text.charCodeAt(index),
        second = input.text.charCodeAt(index + 1);
      regex.lastIndex =
        index +
        (unicode &&
        first >= 0xd800 &&
        first <= 0xdbff &&
        second >= 0xdc00 &&
        second <= 0xdfff
          ? 2
          : 1);
    }
  }
}
