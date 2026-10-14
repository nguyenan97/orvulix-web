import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const levels = ['info', 'low', 'moderate', 'high', 'critical'];
const object = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);
const fail = (message) => {
  throw new Error(message);
};
const packageName = /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i;
const advisoryId = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i;
const nodePath =
  /^node_modules\/(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+(?:\/node_modules\/(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)*$/i;
const key = (finding) =>
  [
    finding.id.toUpperCase(),
    finding.package,
    finding.path,
    finding.version
  ].join('|');

/** Trust neither a registry error nor an incomplete report as a clean audit. */
export function normalizeAudit(report, lock) {
  if (
    !object(report) ||
    report.error ||
    report.auditReportVersion !== 2 ||
    !object(report.vulnerabilities) ||
    !object(report.metadata?.vulnerabilities) ||
    !object(lock?.packages) ||
    ![2, 3].includes(lock.lockfileVersion)
  )
    fail('Invalid or incomplete npm audit report/lockfile.');
  const entries = Object.entries(report.vulnerabilities);
  const counts = Object.fromEntries(levels.map((level) => [level, 0]));
  const findings = new Map();
  const resolved = new Set();
  const walk = (name, visiting = new Set()) => {
    if (visiting.has(name)) fail('Cyclic audit advisory references.');
    if (resolved.has(name)) return;
    const value = report.vulnerabilities[name];
    if (
      !object(value) ||
      value.name !== name ||
      !packageName.test(name) ||
      !levels.includes(value.severity) ||
      !Array.isArray(value.nodes) ||
      !value.nodes.length ||
      !Array.isArray(value.via) ||
      !value.via.length
    )
      fail('Invalid vulnerability entry or unresolved advisory reference.');
    const nodes = value.nodes.map((path) => {
      const installed = lock.packages[path];
      if (
        typeof path !== 'string' ||
        !nodePath.test(path) ||
        !object(installed) ||
        typeof installed.version !== 'string' ||
        !/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(installed.version)
      )
        fail('Audit node does not match an installed lockfile version.');
      return { path, version: installed.version };
    });
    for (const via of value.via) {
      if (typeof via === 'string') {
        walk(via, new Set([...visiting, name]));
        continue;
      }
      if (
        !object(via) ||
        !Number.isSafeInteger(via.source) ||
        via.source <= 0 ||
        via.name !== name ||
        !levels.includes(via.severity) ||
        typeof via.range !== 'string' ||
        !via.range ||
        typeof via.url !== 'string'
      )
        fail('Invalid concrete advisory.');
      const match = via.url.match(
        /^https:\/\/github\.com\/advisories\/(GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})$/i
      );
      if (!match)
        fail('Unrecognized advisory identity. Review the report schema.');
      for (const node of nodes) {
        const finding = {
          id: match[1].toUpperCase(),
          package: name,
          ...node,
          severity: via.severity
        };
        const previous = findings.get(key(finding));
        if (
          !previous ||
          levels.indexOf(previous.severity) < levels.indexOf(finding.severity)
        )
          findings.set(key(finding), finding);
      }
    }
    resolved.add(name);
  };
  for (const [name, value] of entries) {
    walk(name);
    counts[value.severity]++;
  }
  for (const level of levels)
    if (report.metadata.vulnerabilities[level] !== counts[level])
      fail('Audit severity totals do not match the report entries.');
  if (report.metadata.vulnerabilities.total !== entries.length)
    fail('Audit package totals do not match the report entries.');
  return {
    counts: { ...counts, total: entries.length },
    findings: [...findings.values()]
  };
}

export function evaluateAudit(
  audit,
  policy,
  today = new Date().toISOString().slice(0, 10)
) {
  if (
    !object(policy) ||
    policy.version !== 1 ||
    !Array.isArray(policy.exceptions)
  )
    fail('Invalid audit exception policy.');
  const exceptions = new Map();
  for (const entry of policy.exceptions) {
    if (
      !object(entry) ||
      !advisoryId.test(entry.id) ||
      !packageName.test(entry.package) ||
      !nodePath.test(entry.path) ||
      typeof entry.version !== 'string' ||
      !/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(entry.version) ||
      !['high', 'critical'].includes(entry.severity) ||
      !['tooling', 'browser-runtime'].includes(entry.scope) ||
      !['reason', 'mitigation', 'owner'].every(
        (field) => typeof entry[field] === 'string' && entry[field].trim()
      ) ||
      typeof entry.expires !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.expires) ||
      !Number.isFinite(Date.parse(entry.expires)) ||
      new Date(entry.expires).toISOString().slice(0, 10) !== entry.expires
    )
      fail('Invalid or overly broad audit exception.');
    if (entry.expires <= today)
      fail(`Expired exception: ${entry.id} ${entry.package}.`);
    if (exceptions.has(key(entry))) fail('Duplicate audit exception.');
    exceptions.set(key(entry), entry);
  }
  const used = new Set(),
    blocked = [];
  for (const finding of audit.findings) {
    if (!['high', 'critical'].includes(finding.severity)) continue;
    const entry = exceptions.get(key(finding));
    if (
      !entry ||
      levels.indexOf(finding.severity) > levels.indexOf(entry.severity)
    )
      blocked.push(finding);
    else used.add(key(finding));
  }
  for (const [identity, entry] of exceptions)
    if (!used.has(identity))
      fail(`Stale/nonmatching exception: ${entry.id} ${entry.package}.`);
  return { blocked, accepted: used.size };
}

export function runAudit(omitDev = false, execute = spawnSync) {
  const result = execute(
    'npm',
    [
      'audit',
      '--json',
      '--audit-level=low',
      ...(omitDev ? ['--omit=dev'] : [])
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
      shell: false
    }
  );
  if (result.error || result.signal || ![0, 1].includes(result.status))
    fail(
      'npm audit could not complete. Check registry access and retry; no clean result was recorded.'
    );
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail('npm audit returned invalid JSON; no clean result was recorded.');
  }
  if (report.error)
    fail('npm audit returned a registry error; no clean result was recorded.');
  const total = report.metadata?.vulnerabilities?.total;
  if (
    (result.status === 0 && total !== 0) ||
    (result.status === 1 && !(total > 0))
  )
    fail('npm audit exit status conflicts with its report.');
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const reportOnly = process.argv.slice(2).join(' ') === '--report';
    if (process.argv.length > 2 && !reportOnly)
      fail('Usage: check-audit.mjs [--report]');
    const lock = JSON.parse(
      readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8')
    );
    const full = normalizeAudit(runAudit(), lock);
    console.log(
      `Full tree: ${full.counts.total} package findings; ${
        new Set(full.findings.map((f) => f.id)).size
      } unique advisories.`
    );
    if (reportOnly) {
      const production = normalizeAudit(runAudit(true), lock);
      console.log(
        `Production dependency tree: ${
          production.counts.total
        } package findings; ${
          new Set(production.findings.map((f) => f.id)).size
        } unique advisories (not proof of browser reachability).`
      );
      process.exitCode = full.counts.total ? 1 : 0;
    } else {
      const policy = JSON.parse(
        readFileSync(
          new URL('../../security/audit-exceptions.json', import.meta.url),
          'utf8'
        )
      );
      const result = evaluateAudit(full, policy);
      for (const finding of result.blocked)
        console.error(
          `BLOCK ${finding.severity}: ${finding.id} ${finding.package}@${finding.version} ${finding.path}`
        );
      console.log(
        `Audit gate: ${result.blocked.length} unaccepted high/critical; ${result.accepted} explicitly accepted temporarily. Moderate/low remain reported.`
      );
      process.exitCode = result.blocked.length ? 1 : 0;
    }
  } catch (error) {
    // Never print the raw registry response/stderr or credentials from npm config.
    console.error(
      `Security check failed: ${
        error instanceof Error ? error.message : 'Unknown audit error.'
      }`
    );
    process.exitCode = 2;
  }
}
