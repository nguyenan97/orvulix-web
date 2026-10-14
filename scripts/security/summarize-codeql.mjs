import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Only metadata/locations leave the runner; never messages, snippets or traces. */
export function summarizeSarif(report) {
  if (
    report?.version !== '2.1.0' ||
    !Array.isArray(report.runs) ||
    !report.runs.length
  )
    throw Error('Invalid CodeQL SARIF report.');
  const findings = [];
  for (const run of report.runs) {
    const driver = run.tool?.driver;
    const components = [driver, ...(run.tool?.extensions ?? [])];
    if (
      driver?.name !== 'CodeQL' ||
      !Array.isArray(run.results) ||
      components.some(
        (component) =>
          !component ||
          (component.rules !== undefined && !Array.isArray(component.rules))
      )
    )
      throw Error('Incomplete CodeQL SARIF report.');
    const rules = components.flatMap((component) => component.rules ?? []);
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    for (const result of run.results) {
      const rule = byId.get(result.ruleId);
      if (!rule || !/^[a-z0-9/._-]+$/i.test(rule.id))
        throw Error('Unknown CodeQL rule identity.');
      const value = rule.properties?.['security-severity'];
      if (
        value !== undefined &&
        !(
          (typeof value === 'string' &&
            /^(?:[0-9](?:\.\d+)?|10(?:\.0+)?)$/.test(value)) ||
          typeof value === 'number'
        )
      )
        throw Error('Invalid CodeQL security severity.');
      const score = value === undefined ? null : Number(value);
      if (
        score !== null &&
        (!Number.isFinite(score) || score < 0 || score > 10)
      )
        throw Error('Invalid CodeQL security severity.');
      const location = result.locations?.[0]?.physicalLocation;
      const uri = location?.artifactLocation?.uri;
      const line = location?.region?.startLine;
      if (typeof uri !== 'string' || !Number.isInteger(line) || line < 1)
        throw Error('Missing CodeQL result location.');
      findings.push({
        rule: rule.id,
        severity:
          score === null
            ? 'non-security'
            : score >= 9
              ? 'critical'
              : score >= 7
                ? 'high'
                : score >= 4
                  ? 'moderate'
                  : 'low',
        // CodeQL normally emits repository-relative paths. Do not disclose
        // absolute paths, URL credentials or unrecognized external locations.
        path:
          /^(?:src|scripts|\.github)\/[a-z0-9/._-]+$/i.test(uri) &&
          !uri.split('/').includes('..')
            ? uri
            : '[external or root source]',
        line
      });
    }
  }
  return {
    total: findings.length,
    highCritical: findings.filter((f) =>
      ['high', 'critical'].includes(f.severity)
    ).length,
    findings
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const directory = process.argv[2];
    if (!directory || process.argv.length !== 3)
      throw Error('Usage: summarize-codeql.mjs <result-directory>');
    const files = readdirSync(directory).filter((file) =>
      file.endsWith('.sarif')
    );
    if (!files.length || files.length > 16)
      throw Error('Missing or excessive CodeQL result files.');
    for (const file of files) {
      const bytes = readFileSync(join(directory, file));
      if (bytes.length > 16 * 1024 * 1024)
        throw Error('CodeQL report exceeds summary byte limit.');
      console.log(
        JSON.stringify(summarizeSarif(JSON.parse(bytes.toString('utf8'))))
      );
    }
  } catch {
    console.error(
      'CodeQL summary failed: results require manual review. No clean result was recorded.'
    );
    process.exitCode = 1;
  }
}
