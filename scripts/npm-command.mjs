import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

/** Windows npm.cmd is not an executable with shell:false. Run its JS CLI directly. */
export function npmCommand(args) {
  if (process.platform !== 'win32') return ['npm', args];
  const cli =
    process.env.npm_execpath ||
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (!existsSync(cli))
    throw new Error('Cannot locate the npm CLI for this Node installation.');
  return [process.execPath, [cli, ...args]];
}
