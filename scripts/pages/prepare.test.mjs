import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  access,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preparePages } from './prepare.mjs';

test('converts Netlify flat routes into Pages directories and validates dev isolation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'orvulix-pages-'));
  try {
    const source = join(root, 'source'),
      output = join(root, 'pages');
    await mkdir(join(source, 'string'), { recursive: true });
    await mkdir(join(source, 'assets'));
    await writeFile(join(source, 'assets', 'app.js'), '');
    const html =
      '<html><head><meta name="robots" content="index, follow"><link rel="canonical" href="https://orvulix.io.vn/"><script type="application/ld+json">{}</script></head><body><a href="/string/uppercase">Tool</a><script src="/demo/assets/app.js"></script></body></html>';
    for (const file of ['index.html', '404.html', 'string/uppercase.html'])
      await writeFile(join(source, file), html);
    await writeFile(
      join(source, 'site.webmanifest'),
      '{"icons":[{"src":"/favicon.svg"}]}'
    );
    await writeFile(join(source, 'sitemap.xml'), 'production');
    await writeFile(join(source, 'CNAME'), 'orvulix.io.vn');
    await preparePages(source, output, '/demo/');
    const page = await readFile(
      join(output, 'string/uppercase/index.html'),
      'utf8'
    );
    assert.match(page, /noindex, follow/);
    assert.match(page, /href="\/demo\/string\/uppercase"/);
    assert.match(page, /src="\/demo\/assets\/app.js"/);
    assert.doesNotMatch(page, /canonical|application\/ld\+json/);
    await assert.rejects(access(join(output, 'sitemap.xml')));
    await assert.rejects(access(join(output, 'CNAME')));
    assert.equal(
      JSON.parse(await readFile(join(output, 'site.webmanifest'))).scope,
      '/demo/'
    );
    assert.equal(
      await readFile(join(output, 'robots.txt'), 'utf8'),
      'User-agent: *\nAllow: /\n'
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
