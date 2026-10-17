import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAudit, evaluateAudit, runAudit } from './check-audit.mjs';

const id = 'GHSA-abcd-1234-efgh';
const node = 'node_modules/example';
const lock = { lockfileVersion: 3, packages: { [node]: { version: '1.2.3' } } };
const clean = () => ({
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0
    }
  }
});
function fixture(severity = 'high', identity = id) {
  const report = clean();
  report.vulnerabilities.example = {
    name: 'example',
    severity,
    nodes: [node],
    via: [
      {
        source: 123,
        name: 'example',
        severity,
        range: '<2.0.0',
        url: `https://github.com/advisories/${identity}`
      }
    ]
  };
  report.metadata.vulnerabilities[severity] =
    report.metadata.vulnerabilities.total = 1;
  return report;
}
const policy = () => ({ version: 1, exceptions: [] });
const exception = () => ({
  id,
  package: 'example',
  path: node,
  version: '1.2.3',
  severity: 'high',
  scope: 'tooling',
  owner: 'maintainer',
  reason: 'No compatible fix is available.',
  mitigation: 'Trusted globs only; isolated CI without secrets.',
  expires: '2026-11-13'
});
const accepted = () => ({ version: 1, exceptions: [exception()] });
const check = (report, exceptions = policy()) =>
  evaluateAudit(normalizeAudit(report, lock), exceptions, '2026-10-14');

test('clean complete report passes', () =>
  assert.deepEqual(check(clean()), { blocked: [], accepted: 0 }));
for (const severity of ['high', 'critical'])
  test(`unaccepted ${severity} blocks`, () =>
    assert.equal(check(fixture(severity)).blocked.length, 1));
test('moderate/low remain visible without blocking', () => {
  for (const severity of ['moderate', 'low']) {
    const normalized = normalizeAudit(fixture(severity), lock);
    assert.equal(normalized.findings[0].severity, severity);
    assert.equal(evaluateAudit(normalized, policy()).blocked.length, 0);
  }
});
test('exact exception matches case-normalized advisory ID', () =>
  assert.equal(check(fixture(), accepted()).accepted, 1));
test('same total count cannot mask a replacement advisory', () => {
  const result = check(fixture('high', 'GHSA-ijkl-5678-mnop'));
  assert.equal(result.blocked.length, 1);
  assert.throws(
    () => check(fixture('high', 'GHSA-ijkl-5678-mnop'), accepted()),
    /Stale/
  );
});
test('severity escalation is never covered by lower severity exception', () =>
  assert.throws(() => check(fixture('critical'), accepted()), /Stale/));
test('changed version/path/package does not inherit exception', () => {
  for (const [field, value] of [
    ['version', '1.2.4'],
    ['path', 'node_modules/parent/node_modules/example'],
    ['package', 'different']
  ]) {
    const p = accepted();
    p.exceptions[0][field] = value;
    assert.throws(() => check(fixture(), p), /Stale/);
  }
});
test('expired exception and expiry today fail', () => {
  for (const expires of ['2026-10-13', '2026-10-14']) {
    const p = accepted();
    p.exceptions[0].expires = expires;
    assert.throws(() => check(fixture(), p), /Expired/);
  }
});
test('fixed/downgraded advisory leaves a stale exception that must be removed', () => {
  assert.throws(() => check(clean(), accepted()), /Stale/);
  assert.throws(() => check(fixture('moderate'), accepted()), /Stale/);
});
test('duplicate/broad/invalid exceptions fail policy validation', () => {
  const duplicate = accepted();
  duplicate.exceptions.push(exception());
  assert.throws(() => check(fixture(), duplicate), /Duplicate/);
  for (const [field, value] of [
    ['id', '*'],
    ['package', '*'],
    ['version', '*'],
    ['path', 'node_modules/../example'],
    ['scope', 'all'],
    ['expires', '2026-02-30'],
    ['owner', ''],
    ['reason', ''],
    ['mitigation', '']
  ]) {
    const p = accepted();
    p.exceptions[0][field] = value;
    assert.throws(() => check(fixture(), p), /Invalid/);
  }
});
test('propagated parent advisories and duplicate sources are normalized once', () => {
  const r = fixture();
  r.vulnerabilities.example.via.push({ ...r.vulnerabilities.example.via[0] });
  r.vulnerabilities.parent = {
    name: 'parent',
    severity: 'high',
    nodes: ['node_modules/parent'],
    via: ['example']
  };
  r.metadata.vulnerabilities.high = r.metadata.vulnerabilities.total = 2;
  const l = structuredClone(lock);
  l.packages['node_modules/parent'] = { version: '2.0.0' };
  const normalized = normalizeAudit(r, l);
  assert.equal(normalized.counts.total, 2);
  assert.equal(normalized.findings.length, 1);
  assert.equal(evaluateAudit(normalized, policy()).blocked.length, 1);
});
test('each nested installed version remains a separate finding', () => {
  const r = fixture(),
    l = structuredClone(lock);
  const nested = 'node_modules/parent/node_modules/example';
  r.vulnerabilities.example.nodes.push(nested);
  l.packages[nested] = { version: '1.2.2' };
  assert.equal(normalizeAudit(r, l).findings.length, 2);
});
test('malformed/partial/error reports never pass as clean', () => {
  for (const r of [
    null,
    {},
    { ...clean(), error: { code: 'NETWORK' } },
    { ...clean(), auditReportVersion: 1 },
    { ...clean(), vulnerabilities: [] }
  ])
    assert.throws(() => normalizeAudit(r, lock), /Invalid/);
  const r = clean();
  r.metadata.vulnerabilities.high = r.metadata.vulnerabilities.total = 1;
  assert.throws(() => normalizeAudit(r, lock), /totals/);
});
test('unknown identity/schema and unresolved/cyclic references fail closed', () => {
  for (const change of [
    (r) =>
      (r.vulnerabilities.example.via[0].url = 'https://unknown.test/advisory'),
    (r) => (r.vulnerabilities.example.via[0].source = null),
    (r) => (r.vulnerabilities.example.nodes = []),
    (r) => (r.vulnerabilities.example.via = ['missing']),
    (r) => (r.vulnerabilities.example.via = ['example'])
  ]) {
    const r = fixture();
    change(r);
    assert.throws(() => normalizeAudit(r, lock));
  }
});
test('missing/invalid installed lockfile version fails closed', () => {
  assert.throws(
    () => normalizeAudit(fixture(), { lockfileVersion: 3, packages: {} }),
    /lockfile/
  );
  assert.throws(
    () =>
      normalizeAudit(fixture(), {
        lockfileVersion: 3,
        packages: { [node]: { version: '*' } }
      }),
    /lockfile/
  );
});
test('npm exit 1 with findings is a valid audit result; exit 0 requires a clean report', () => {
  assert.deepEqual(
    runAudit(false, () => ({ status: 1, stdout: JSON.stringify(fixture()) })),
    fixture()
  );
  assert.deepEqual(
    runAudit(false, () => ({ status: 0, stdout: JSON.stringify(clean()) })),
    clean()
  );
});
test('network failure, timeout, unexpected exit and malformed JSON do not expose stderr', () => {
  for (const response of [
    { error: Error('secret-token') },
    { status: null, signal: 'SIGTERM' },
    { status: 2, stderr: 'secret-token' },
    { status: 0, stdout: 'not JSON' },
    {
      status: 1,
      stdout: JSON.stringify({
        error: { code: 'NETWORK', detail: 'secret-token' }
      })
    }
  ]) {
    assert.throws(
      () => runAudit(false, () => response),
      (error) => !error.message.includes('secret-token')
    );
  }
});
test('conflicting exit status and audit totals are rejected', () => {
  assert.throws(
    () =>
      runAudit(false, () => ({ status: 0, stdout: JSON.stringify(fixture()) })),
    /conflicts/
  );
  assert.throws(
    () =>
      runAudit(false, () => ({ status: 1, stdout: JSON.stringify(clean()) })),
    /conflicts/
  );
});
test('audit invocation is bounded, uses no shell and can omit dev dependencies', () => {
  runAudit(true, (command, args, options) => {
    assert.equal(
      command,
      process.platform === 'win32' ? process.execPath : 'npm'
    );
    if (process.platform === 'win32') assert.match(args[0], /npm-cli\.js$/);
    assert.ok(args.includes('--omit=dev'));
    assert.equal(options.shell, false);
    assert.equal(options.timeout, 120_000);
    assert.equal(options.maxBuffer, 8 * 1024 * 1024);
    return { status: 0, stdout: JSON.stringify(clean()) };
  });
});
