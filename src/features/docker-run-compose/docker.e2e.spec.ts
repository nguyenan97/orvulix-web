import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { nativeClipboardText } from '../text-result-clipboard/testing/native-text';
const prefix = process.env.COPY_TEST_PREFIX ?? '';
const path = `${prefix}/converters/docker-run-to-compose`;
const minimal =
  '"services":\n  "app":\n    "image": "alpine"\n    "network_mode": "bridge"\n';
declare global {
  interface Window {
    orvulixDockerCopies: string[];
    orvulixDockerDeny: boolean;
  }
}
test.beforeEach(async ({ page, context, browserName }) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    window.orvulixDockerCopies = [];
    window.orvulixDockerDeny = false;
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: async (value: string) => {
        if (window.orvulixDockerDeny)
          throw new DOMException('denied by test', 'NotAllowedError');
        await original(value);
        window.orvulixDockerCopies.push(value);
      }
    });
  });
  await page.goto(path);
  await expect(
    page.getByRole('heading', { name: 'Docker Run to Compose', exact: true })
  ).toBeVisible();
});
test('native copy and downloaded YAML preserve exact literal content, denial recovery and no input transport', async ({
  page,
  browserName
}) => {
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(
      `${request.method()} ${request.url()} ${request.postData() ?? ''}`
    )
  );
  await page.getByTestId('text-input').fill('docker run alpine');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(minimal);
  await page
    .getByRole('button', { name: 'Copy Compose YAML', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.orvulixDockerCopies))
    .toEqual([minimal]);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      nativeClipboardText(minimal)
    );
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Compose YAML' }).click();
  const downloaded = await downloadEvent;
  expect(downloaded.suggestedFilename()).toMatch(/compose\.yaml$/);
  expect(await readFile((await downloaded.path())!, 'utf8')).toBe(minimal);
  await page.evaluate(() => {
    window.orvulixDockerDeny = true;
  });
  await page
    .getByRole('button', { name: 'Copy Compose YAML', exact: true })
    .click();
  await expect(page.getByText(/Clipboard access failed/)).toBeVisible();
  await page.evaluate(() => {
    window.orvulixDockerDeny = false;
  });
  const payload =
    "docker run -e 'PRIVATE_DOCKER_LITERAL=Việt 😀 $HOME' alpine sh -c 'echo \"<img src=x onerror=window.dockerInjected=1>\"'";
  await page.getByTestId('text-input').fill(payload);
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(
    /PRIVATE_DOCKER_LITERAL=Việt 😀 \$\$HOME/
  );
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => Object.hasOwn(window, 'dockerInjected'))
  ).toBe(false);
  await page
    .getByRole('button', { name: 'Copy Compose YAML', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.orvulixDockerCopies.length))
    .toBe(2);
  expect(
    requests.every(
      (value) =>
        value.startsWith('GET ') && !value.includes('PRIVATE_DOCKER_LITERAL')
    )
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      [...Object.values(localStorage), ...Object.values(sessionStorage)].some(
        (value) => value.includes('PRIVATE_DOCKER_LITERAL')
      )
    )
  ).toBe(false);
});
test('ports, mounts, existing networks, restart and argv are preserved in a complete native YAML download', async ({
  page
}) => {
  await page
    .getByTestId('text-input')
    .fill(
      "docker run -it --name web -p 127.0.0.1:8080:80 -v data:/data:ro -v /tmp:/files:ro -e 'A=hello world' --network shared-net --restart unless-stopped nginx:alpine echo '' --flag"
    );
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  const expected =
    '"services":\n  "app":\n    "image": "nginx:alpine"\n    "stdin_open": true\n    "tty": true\n    "container_name": "web"\n    "restart": "unless-stopped"\n    "ports":\n      - "127.0.0.1:8080:80"\n    "volumes":\n      -\n        "type": "volume"\n        "source": "volume_1"\n        "target": "/data"\n        "read_only": true\n      -\n        "type": "bind"\n        "source": "/tmp"\n        "target": "/files"\n        "read_only": true\n        "bind":\n          "create_host_path": true\n    "environment":\n      - "A=hello world"\n    "networks":\n      - "existing_network"\n    "command":\n      - "echo"\n      - ""\n      - "--flag"\n"volumes":\n  "volume_1":\n    "name": "data"\n"networks":\n  "existing_network":\n    "name": "shared-net"\n    "external": true\n';
  await expect(page.getByTestId('compose-output')).toHaveValue(expected);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Compose YAML' }).click();
  expect(await readFile((await (await downloadEvent).path())!, 'utf8')).toBe(
    expected
  );
});
test('malformed, unsupported and edited commands never export stale output and valid edits recover', async ({
  page
}) => {
  await page.getByTestId('text-input').fill('docker run alpine');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  for (const [source, message] of [
    ['docker run --privileged alpine', /Unsupported Docker option/],
    ['docker run alpine; echo bad', /Shell expansion/],
    ['docker run -p 99999:80 alpine', /port mapping/],
    ['docker run "alpine', /Incomplete quote/]
  ] as const) {
    await page.getByTestId('text-input').fill(source);
    await expect(page.getByTestId('compose-output')).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Copy Compose YAML', exact: true })
    ).toBeDisabled();
    await page
      .getByRole('button', { name: 'Convert command', exact: true })
      .click();
    await expect(
      page.getByRole('alert').filter({ hasText: message })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Download Compose YAML' })
    ).toBeDisabled();
  }
  await page.getByTestId('text-input').fill('docker run alpine');
  await page
    .getByLabel('Compose service name', { exact: true })
    .fill('bad name');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByText(/Service name must start/)).toBeVisible();
  await page.getByLabel('Compose service name', { exact: true }).fill('api');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(
    minimal.replace('"app"', '"api"')
  );
  await page
    .getByRole('button', { name: 'Clear command', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Download Compose YAML' })
  ).toBeDisabled();
});
test('source/output budgets reject one-over and recover without truncation', async ({
  page
}) => {
  await page
    .getByTestId('text-input')
    .fill('docker run alpine'.padEnd(32768, ' '));
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(minimal);
  await page.getByTestId('text-input').fill('x'.repeat(32769));
  await expect(
    page.getByRole('button', { name: 'Convert command', exact: true })
  ).toBeDisabled();
  await expect(page.getByText(/Command exceeds 32,768/)).toBeVisible();
  await page
    .getByTestId('text-input')
    .fill("docker run alpine echo '" + '\u2028'.repeat(32000) + "'");
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByText(/Compose output exceeds 131,072/)).toBeVisible();
  await expect(page.getByTestId('compose-output')).toHaveValue('');
  await page.getByTestId('text-input').fill('docker run alpine');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(minimal);
});
test('mobile dark keyboard flow remains accessible without horizontal overflow', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Load example', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('status').filter({ hasText: 'Compose YAML generated.' })
  ).toBeVisible();
  await page.getByLabel('Compose service name', { exact: true }).fill('null');
  await expect(
    page.getByRole('button', { name: 'Copy Compose YAML', exact: true })
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Convert command', exact: true })
    .click();
  await expect(page.getByTestId('compose-output')).toHaveValue(/ {2}"null":/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test('developer search and converter category expose the new tool without changing media audiences', async ({
  page
}) => {
  await page.goto(`${prefix}/`);
  await page.getByRole('button', { name: 'Developers', exact: true }).click();
  const search = page.locator('input[role=combobox]');
  await search.fill('docker compose');
  await expect(
    page.getByRole('option').filter({ hasText: 'Docker Run to Compose' })
  ).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await page.goto(`${prefix}/categories/converters`);
  await expect(
    page.getByRole('link', { name: /Docker Run to Compose/ })
  ).toBeVisible();
});
test('static route metadata and content preserve production or Pages isolation', async ({
  page,
  browser,
  baseURL
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage();
    await staticPage.goto(`${baseURL}${path}${prefix ? '/' : ''}`);
    await expect(
      staticPage.getByRole('heading', {
        name: 'Docker Run to Compose',
        exact: true
      })
    ).toBeVisible();
    await expect(
      staticPage.getByText('Publish an Nginx port', { exact: true })
    ).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Docker run commands/
    );
    if (prefix) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow'
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    } else
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /\/converters\/docker-run-to-compose$/
      );
  } finally {
    await context.close();
  }
});
