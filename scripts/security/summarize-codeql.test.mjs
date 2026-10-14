import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSarif } from './summarize-codeql.mjs';
function report(score = '7.5', path = 'src/example.ts') {
  return {
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'CodeQL',
            rules: [
              { id: 'js/example', properties: { 'security-severity': score } }
            ]
          }
        },
        results: [
          {
            ruleId: 'js/example',
            message: { text: 'SECRET CONTENT' },
            codeFlows: ['SECRET CONTENT'],
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: path },
                  region: { startLine: 12, snippet: { text: 'SECRET CONTENT' } }
                }
              }
            ]
          }
        ]
      }
    ]
  };
}
test('summary contains rule/severity/location but no snippets/messages/traces', () => {
  const result = summarizeSarif(report());
  assert.deepEqual(result, {
    total: 1,
    highCritical: 1,
    findings: [
      { rule: 'js/example', severity: 'high', path: 'src/example.ts', line: 12 }
    ]
  });
  assert.ok(!JSON.stringify(result).includes('SECRET CONTENT'));
});
test('critical/moderate/low thresholds remain explicit', () => {
  for (const [score, severity] of [
    ['9', 'critical'],
    ['4', 'moderate'],
    ['3.9', 'low']
  ])
    assert.equal(summarizeSarif(report(score)).findings[0].severity, severity);
});
test('external/credential-bearing/traversal paths are never logged', () => {
  for (const path of [
    'file:///private/SECRET',
    'https://user:SECRET@host/file',
    'src/../SECRET',
    'src/file.ts?SECRET'
  ])
    assert.ok(
      !JSON.stringify(summarizeSarif(report('7.5', path))).includes('SECRET')
    );
});
test('empty result set is a verified zero result, not a missing file', () => {
  const r = report();
  r.runs[0].results = [];
  assert.equal(summarizeSarif(r).total, 0);
});
test('unknown rules, missing schema/location and invalid severity fail closed', () => {
  for (const r of [
    {},
    { version: '2.1.0', runs: [] },
    report('NaN'),
    report('11')
  ])
    assert.throws(() => summarizeSarif(r));
  const r = report();
  r.runs[0].results[0].ruleId = 'unknown';
  assert.throws(() => summarizeSarif(r));
});
