import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  OLDER,
  createGitDates,
  latestDate
} from '../../scripts/seo/lastmod.mjs';

const DATES = {
  c1: '2024-01-01T10:00:00+00:00',
  c2: '2024-02-01T10:00:00+00:00',
  c3: '2024-03-01T10:00:00+00:00',
  c4: '2024-04-01T10:00:00+00:00',
  c5: '2024-05-01T10:00:00+00:00'
};

const git = (cwd: string, args: string[], date?: string) =>
  execFileSync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {})
    }
  }).toString();

let repo: string;

const commit = (files: Record<string, string>, date: string) => {
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(repo, file, '..'), { recursive: true });
    writeFileSync(join(repo, file), content);
  }
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-q', '-m', date], date);
};

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'seo-lastmod-'));
  git(repo, ['init', '-q', '-b', 'main']);
  commit(
    {
      'en.json': '{"a":{"t":"1"},"b":{"t":"1"}}',
      'src/x.ts': 'export const x = 1;\n'
    },
    DATES.c1
  );
  commit({ 'en.json': '{"a":{"t":"1"},"b":{"t":"2"}}' }, DATES.c2);
  commit({ 'en.json': '{"a":{"t":"1"},' }, DATES.c3);
  commit(
    {
      'en.json':
        '{\n  "a": {"t": "1"},\n  "b": {"t": "2"},\n  "c": {"t": "3"}\n}'
    },
    DATES.c4
  );
  commit({ 'src/x.ts': 'export const x = 2;\n' }, DATES.c5);
});

describe('Git-based lastmod', () => {
  it('dates JSON keys by the change of their values, not of the file', async () => {
    const dates = (await createGitDates(repo))!;
    expect(await dates.jsonKeyDate('en.json', [['a']])).toBe(DATES.c1);
    expect(await dates.jsonKeyDate('en.json', [['b']])).toBe(DATES.c2);
    expect(await dates.jsonKeyDate('en.json', [['c']])).toBe(DATES.c4);
    expect(await dates.jsonKeyDate('en.json', [['a'], ['b']])).toBe(DATES.c2);
  });

  it('dates files by their latest commit', async () => {
    const dates = (await createGitDates(repo))!;
    expect(await dates.pathDate(['src/x.ts'])).toBe(DATES.c5);
    expect(await dates.pathDate(['src'])).toBe(DATES.c5);
    expect(await dates.pathDate(['en.json'])).toBe(DATES.c4);
  });

  it('marks history beyond a shallow clone as older instead of inventing a date', async () => {
    const clone = mkdtempSync(join(tmpdir(), 'seo-lastmod-shallow-'));
    git(clone, ['clone', '-q', '--depth', '2', `file://${repo}`, '.']);
    const dates = (await createGitDates(clone))!;
    expect(dates.shallow).toBe(true);
    expect(await dates.pathDate(['src/x.ts'])).toBe(DATES.c5);
    expect(await dates.jsonKeyDate('en.json', [['a']])).toBe(OLDER);
    expect(latestDate([OLDER, DATES.c5])).toBe(DATES.c5);
    expect(latestDate([OLDER])).toBeNull();
  });

  it('treats uncommitted or untracked sources as unverifiable', async () => {
    const clone = mkdtempSync(join(tmpdir(), 'seo-lastmod-dirty-'));
    git(clone, ['clone', '-q', `file://${repo}`, '.']);
    writeFileSync(join(clone, 'src/x.ts'), 'export const x = 3;\n');
    writeFileSync(join(clone, 'new.ts'), 'export {};\n');
    writeFileSync(join(clone, 'en.json'), '{"a":{"t":"9"}}');
    const dates = (await createGitDates(clone))!;
    expect(await dates.pathDate(['src/x.ts'])).toBeNull();
    expect(await dates.pathDate(['new.ts'])).toBeNull();
    expect(await dates.jsonKeyDate('en.json', [['a']])).toBeNull();
    expect(latestDate([null, DATES.c5])).toBeNull();
  });

  it('returns null outside a Git repository', async () => {
    expect(
      await createGitDates(mkdtempSync(join(tmpdir(), 'seo-no-git-')))
    ).toBeNull();
  });
});
