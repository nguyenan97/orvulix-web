import { build } from 'esbuild';

/**
 * Loads the shared SEO core (src/seo/node.ts) in Node. The TypeScript sources
 * are bundled in memory with esbuild (the bundler Vite already uses) and
 * imported from a data: URL, so the generator and the client run the same
 * code. The core must not depend on packages from node_modules.
 */
export async function loadSeoCore() {
  const result = await build({
    entryPoints: ['src/seo/node.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    write: false,
    metafile: true,
    logLevel: 'silent'
  });
  const external = Object.keys(result.metafile.inputs).filter((input) =>
    input.includes('node_modules')
  );
  if (external.length) {
    throw new Error(
      `src/seo/node.ts must not import packages (found ${external.join(', ')}).`
    );
  }
  const code = result.outputFiles[0].text;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
}
