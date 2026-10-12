import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLANNED_FEATURES } from './roadmap';

describe('public roadmap scope', () => {
  it('keeps feature names and proposed order aligned with the technical backlog', () => {
    const backlog = readFileSync('docs/FEATURE_BACKLOG.md', 'utf8');
    const table = backlog
      .split('## Ordered feature plan')[1]
      .split('## Suggested delivery sequence')[0];
    const titles = [...table.matchAll(/\| \d+ \| \*\*(.+?)\*\*/g)].map(
      (match) => match[1]
    );
    expect(PLANNED_FEATURES.map((feature) => feature.title)).toEqual(titles);
  });
});
