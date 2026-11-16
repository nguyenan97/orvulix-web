import { readFile, writeFile } from 'node:fs/promises';
import { clsScore } from './metrics.mjs';

const [beforeFile, afterFile, resultFile] = process.argv.slice(2);
if (!beforeFile || !afterFile || !resultFile)
  throw Error(
    'Usage: node scripts/performance/compare.mjs <before.json> <after.json> <result.json>'
  );
const [before, after] = await Promise.all(
  [beforeFile, afterFile].map(async (file) =>
    JSON.parse(await readFile(file, 'utf8'))
  )
);
if (
  JSON.stringify(before.profile) !== JSON.stringify(after.profile) ||
  before.browser !== after.browser
)
  throw Error('Browser and measurement profiles must match.');
const median = (items) => {
  const sorted = [...items].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const compact = (sample) => ({
  route: sample.route,
  iteration: sample.iteration,
  lcpMs: sample.lcp,
  cls: clsScore(sample.shifts),
  readyMs: sample.ready,
  headingMs: sample.firstContent,
  fcpMs: sample.paints.find((paint) => paint.name === 'first-contentful-paint')
    ?.startTime,
  jsBytes: sample.jsBytes,
  cssBytes: sample.cssBytes,
  requests: sample.requestCount,
  longTasks: sample.longTasks.length,
  blockingOver50Ms: sample.totalBlockingMs,
  errors: sample.errors,
  overflow: sample.overflow
});
const phases = [before, after].map((phase) => ({
  measuredAt: phase.measuredAt,
  samples: phase.samples.map(compact),
  // One representative waterfall per route, no response bodies or source snippets.
  waterfalls: phase.samples
    .filter((sample) => sample.iteration === 1)
    .map((sample) => ({
      route: sample.route,
      requests: sample.network.map((request) => ({
        url: request.url,
        type: request.type,
        status: request.status,
        bytes: request.encodedBytes,
        failed: request.failed,
        startMs: (request.start - sample.network[0].start) * 1000,
        endMs: request.end
          ? (request.end - sample.network[0].start) * 1000
          : undefined,
        parent: request.parent
      }))
    }))
}));
const routes = ['/', '/string/reverse', '/pdf/split-pdf'].map((route) => {
  const values = phases.map((phase) => {
    const samples = phase.samples.filter((sample) => sample.route === route);
    if (
      samples.length !== 3 ||
      samples.some(
        (s) => !s.lcpMs || !s.readyMs || s.errors.length || s.overflow
      )
    )
      throw Error(
        'Expected three completed, error-free mobile samples per route.'
      );
    return Object.fromEntries(
      [
        'lcpMs',
        'cls',
        'readyMs',
        'headingMs',
        'fcpMs',
        'jsBytes',
        'cssBytes',
        'requests',
        'longTasks',
        'blockingOver50Ms'
      ].map((key) => [key, median(samples.map((sample) => sample[key]))])
    );
  });
  return { route, before: values[0], after: values[1] };
});
const report = {
  browser: before.browser,
  profile: before.profile,
  routes,
  phases
};
await writeFile(resultFile, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(routes, null, 2));
