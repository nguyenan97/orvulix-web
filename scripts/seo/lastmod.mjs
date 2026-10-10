import { execFile, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

/**
 * Last-modified dates from Git history. Dates are commit dates of the most
 * recent change to a page's content sources; nothing is ever derived from
 * the build time.
 *
 * Each source resolves to an ISO date, OLDER (the change happened before the
 * history available in a shallow clone, so any known date is later) or null
 * (not verifiable: uncommitted changes, untracked files, unreadable objects).
 * A page date is the latest known date; it is omitted when any source is
 * null or when no source has a known date.
 */

export const OLDER = 'older-than-history';

const run = promisify(execFile);

const gitIn = (root) => async (args) =>
  (await run('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 })).stdout;

/** Reads many blobs with one `git cat-file --batch` process. */
function readBlobs(root, specs) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['cat-file', '--batch'], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'inherit']
    });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0)
        return reject(new Error(`git cat-file exited with ${code}`));
      const output = Buffer.concat(chunks);
      const blobs = [];
      let offset = 0;
      for (let index = 0; index < specs.length; index += 1) {
        const newline = output.indexOf(10, offset);
        const header = output.subarray(offset, newline).toString();
        offset = newline + 1;
        if (header.endsWith(' missing')) {
          blobs.push(null);
          continue;
        }
        const size = Number(header.split(' ')[2]);
        blobs.push(output.subarray(offset, offset + size).toString('utf8'));
        offset += size + 1;
      }
      resolve(blobs);
    });
    child.stdin.end(specs.map((spec) => `${spec}\n`).join(''));
  });
}

const valueAt = (data, path) => {
  let value = data;
  for (const part of path) value = value?.[part];
  return value === undefined ? undefined : JSON.stringify(value);
};

export async function createGitDates(root = process.cwd()) {
  const git = gitIn(root);
  try {
    if ((await git(['rev-parse', '--is-inside-work-tree'])).trim() !== 'true')
      return null;
  } catch {
    return null;
  }
  let boundaries = new Set();
  try {
    const shallowFile = (
      await git(['rev-parse', '--git-path', 'shallow'])
    ).trim();
    boundaries = new Set(
      (await readFile(resolve(root, shallowFile), 'utf8'))
        .split('\n')
        .filter(Boolean)
    );
  } catch {
    // not a shallow clone
  }
  const dirty = new Set(
    (await git(['status', '--porcelain', '--untracked-files=all']))
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3))
  );
  const isDirty = (paths) =>
    [...dirty].some((file) =>
      paths.some((path) => file === path || file.startsWith(`${path}/`))
    );

  /** Most recent commit date touching any of the paths, or null. */
  const pathDate = async (paths) => {
    if (!paths.length || isDirty(paths)) return null;
    const line = (
      await git(['log', '-1', '--format=%H %cI', '--', ...paths])
    ).trim();
    if (!line) return null;
    const [sha, date] = line.split(' ');
    return boundaries.has(sha) ? OLDER : date;
  };

  const jsonHistories = new Map();
  /** Committed versions of a JSON file, newest first. */
  const jsonHistory = async (file) => {
    if (!jsonHistories.has(file)) {
      jsonHistories.set(
        file,
        (async () => {
          const commits = (await git(['log', '--format=%H %cI', '--', file]))
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const [sha, date] = line.split(' ');
              return { sha, date };
            });
          const blobs = await readBlobs(
            root,
            commits.map(({ sha }) => `${sha}:${file}`)
          );
          return commits.map((commit, index) => {
            let data = null;
            try {
              data = blobs[index] === null ? null : JSON.parse(blobs[index]);
            } catch {
              data = null;
            }
            return { ...commit, data, readable: blobs[index] !== null };
          });
        })()
      );
    }
    return jsonHistories.get(file);
  };

  /**
   * Date on which the current values at the given key paths of a JSON file
   * (e.g. [['uppercase']] for string.json) first appeared: the oldest
   * committed version, walking back from the newest, that still has exactly
   * those values. Versions that are not valid JSON (e.g. commits with merge
   * conflict markers) are skipped, which can only make the date older, never
   * newer than the real change.
   */
  const jsonKeyDate = async (file, keyPaths) => {
    if (isDirty([file])) return null;
    const history = await jsonHistory(file);
    if (!history.length) return null;
    const snapshot = (entry) =>
      keyPaths.map((path) => valueAt(entry.data, path)).join('\u0000');
    let current = null;
    let firstSeen = null;
    for (const entry of history) {
      if (!entry.readable) return null;
      if (entry.data === null) continue;
      const value = snapshot(entry);
      if (current === null) current = value;
      if (value !== current) return firstSeen.date;
      firstSeen = entry;
    }
    if (!firstSeen) return null;
    if (boundaries.has(history[history.length - 1].sha)) return OLDER;
    const present = keyPaths.some(
      (path) => valueAt(firstSeen.data, path) !== undefined
    );
    return present ? firstSeen.date : null;
  };

  return { pathDate, jsonKeyDate, shallow: boundaries.size > 0 };
}

/** Latest known date of a page's sources, or null when it is not verifiable. */
export const latestDate = (dates) => {
  if (dates.some((date) => date === null || date === undefined)) return null;
  const known = dates.filter((date) => date !== OLDER);
  if (!known.length) return null;
  return known.reduce((latest, date) =>
    new Date(date).getTime() > new Date(latest).getTime() ? date : latest
  );
};
