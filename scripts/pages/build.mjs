import { spawnSync } from 'node:child_process';
import { preparePages } from './prepare.mjs';

const base = process.env.PAGES_BASE_PATH || '/orvulix-web/';
if (!/^\/[a-zA-Z0-9._-]+\/$/.test(base))
  throw new Error('PAGES_BASE_PATH must be /repository-name/.');
const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run('npm', ['run', 'typecheck']);
run('node', ['node_modules/vite/bin/vite.js', 'build', '--base', base], {
  VITE_PAGES_DEV: 'true'
});
run('node', ['scripts/seo/prerender.mjs']);
await preparePages('dist', 'pages-dist', base);
