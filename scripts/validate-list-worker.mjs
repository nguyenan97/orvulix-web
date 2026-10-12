import { build } from 'esbuild';
import { readFile, readdir } from 'node:fs/promises';
// Audit actual inputs after TypeScript erases type-only imports. No emitted file
// or dependency is added; normal Vite builds still own worker asset generation.
const result = await build({
  entryPoints: ['src/workers/list-regex/list.worker.ts'],
  bundle: true,
  write: false,
  metafile: true,
  platform: 'browser',
  format: 'esm'
});
const inputs = Object.keys(result.metafile.inputs);
const forbidden = inputs.filter((path) =>
  /node_modules|src\/utils\/string\.ts|src\/tools\/|src\/i18n|src\/components\/|\.tsx$/.test(
    path
  )
);
if (forbidden.length)
  throw Error(`Unexpected worker runtime inputs: ${forbidden.join(', ')}`);
const assets = (await readdir('dist/assets')).filter((name) =>
  /^list\.worker-.*\.js$/.test(name)
);
if (assets.length !== 1) throw Error('Expected one Vite list worker asset.');
const code = await readFile(`dist/assets/${assets[0]}`, 'utf8');
if (/localStorage|document\.|window\.|i18next|react-dom/.test(code))
  throw Error('Browser application initialization found in worker.');
console.log(
  `List worker audit passed: ${inputs.length} pure inputs; emitted ${
    assets[0]
  } (${Buffer.byteLength(code)} bytes).`
);
