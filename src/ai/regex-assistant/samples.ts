export const REGEX_SAMPLES = [
  {
    id: 'hashtags',
    label: 'Hashtags',
    pattern: '#([A-Za-z0-9_]+)',
    flags: 'g',
    text: 'Explore #Orvulix and #OpenSource. A bare # is not a tag.',
    explanation:
      'The literal # starts a tag. The capture group accepts one or more ASCII letters, digits or underscores. The g flag finds multiple matches. This example does not cover all Unicode hashtags.',
    tests: [
      { text: '#Orvulix #demo', count: 2 },
      { text: 'A bare #', count: 0 }
    ]
  },
  {
    id: 'dates',
    label: 'Date shapes',
    pattern: '\\b(\\d{4})-(\\d{2})-(\\d{2})\\b',
    flags: 'g',
    text: 'Dates: 2026-10-11, 2026-99-99 and 11/10/2026.',
    explanation:
      'Digit groups capture a four-digit year, two-digit month and two-digit day separated by hyphens. Word boundaries limit adjacent word characters. This checks shape only: 2026-99-99 matches even though it is not a valid date.',
    tests: [
      { text: '2026-10-11 2026-99-99', count: 2 },
      { text: '11/10/2026', count: 0 }
    ]
  },
  {
    id: 'logs',
    label: 'Log levels',
    pattern: '^\\[(INFO|WARN|ERROR)\\]',
    flags: 'gm',
    text: '[INFO] Started\n[ERROR] Example failure\n[DEBUG] Details\n  [WARN] Indented',
    explanation:
      'The anchor ^ selects the beginning of each line because m is enabled. Escaped brackets match literal brackets and the group accepts one of three uppercase levels. The g flag finds multiple lines. Indented lines and DEBUG are excluded.',
    tests: [
      { text: '[INFO] Started\n[WARN] Check', count: 2 },
      { text: '[DEBUG] Details\n  [ERROR] Indented', count: 0 }
    ]
  }
] as const;

/** Authored explanations apply only to an unchanged fixture, never custom input. */
export function sampleExplanation(
  pattern: string,
  flags: string,
  text: string
) {
  return REGEX_SAMPLES.find(
    (sample) =>
      sample.pattern === pattern &&
      sample.flags === flags &&
      sample.text === text
  )?.explanation;
}
