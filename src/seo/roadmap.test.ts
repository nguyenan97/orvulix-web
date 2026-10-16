import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PLANNED_FEATURES,
  DEVELOPMENT_UPDATES,
  DEVELOPMENT_NOTICE,
  ROADMAP_FOUNDATION,
  roadmapSections
} from './roadmap';

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

it('records only the verified development scopes and their actual delivery PRs', () => {
  expect(DEVELOPMENT_UPDATES.map((update) => update.title)).toEqual([
    'Bounded list regex execution',
    'Local HTML conversion',
    'PNG dimension preservation',
    'Bounded multi-file import',
    'GIF output reliability',
    'Merge PDF output ownership',
    'Text-result clipboard reliability',
    'Code-result clipboard reliability',
    'Input clipboard reliability',
    'External PDF Editor opt-in',
    'Text and code file import ownership',
    'JSON Prettify result ownership',
    'JSON Minify result ownership'
  ]);
  for (const [index, prs] of [
    [19],
    [20, 22],
    [24],
    [25],
    [26, 27],
    [29],
    [30],
    [31],
    [32],
    [33],
    [34],
    [35],
    [36]
  ].entries())
    for (const pr of prs)
      expect(DEVELOPMENT_UPDATES[index].description).toContain(`PR #${pr}`);
  expect(DEVELOPMENT_NOTICE).toContain('not released to production');
  expect(DEVELOPMENT_NOTICE).toContain('URL conversion remains paused');
});
it('retains planned milestones separately from partial development delivery', () => {
  const sections = roadmapSections();
  expect(
    sections.find(
      (section) => section.heading === 'Delivered development scope'
    )?.examples
  ).toHaveLength(13);
  expect(
    sections.find((section) => section.heading === 'Proposed order')?.examples
  ).toHaveLength(12);
  expect(DEVELOPMENT_UPDATES[2].description).toContain(
    'not a lossless optimizer'
  );
  expect(DEVELOPMENT_UPDATES[4].description).toContain('remain separate');
  expect(ROADMAP_FOUNDATION).not.toContain('we will address regex');
});
