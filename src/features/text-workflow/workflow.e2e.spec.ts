import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { nativeClipboardText } from '../text-result-clipboard/testing/native-text';

const prefix = process.env.COPY_TEST_PREFIX ?? '';
const path = `${prefix}/string/text-workflow`;
const trim = { type: 'trim', options: {} };
const upper = { type: 'uppercase', options: {} };
const reverse = { type: 'reverse', options: {} };
const dedup = {
  type: 'deduplicate',
  options: {
    mode: 'all',
    newlines: 'filter',
    sortLines: false,
    trimTextLines: false
  }
};
const encode = (type: string) => ({ type, options: { mode: 'encode' } });
const decode = (type: string) => ({ type, options: { mode: 'decode' } });
interface Probe {
  blockRequests: boolean;
  created: number;
  terminated: number;
  active: number;
  reads: number;
  copies: string[];
  deny: boolean;
}
declare global {
  interface Window {
    orvulixWorkflowProbe: Probe;
  }
}
async function importSteps(page: Page, steps: unknown[]) {
  await page.getByLabel('Recipe file', { exact: true }).setInputFiles({
    name: 'recipe.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, steps }))
  });
  await expect(
    page.getByText('Recipe imported. Input text is unchanged.', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: `Workflow steps (${steps.length}/16)`,
      exact: true
    })
  ).toBeVisible();
}
async function run(page: Page, expected: string) {
  await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Workflow complete.' })
  ).toBeVisible();
  await expect(page.getByTestId('workflow-result')).toHaveValue(expected);
}
test.beforeEach(async ({ page, context, browserName }) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    const probe: Probe = (window.orvulixWorkflowProbe = {
      blockRequests: false,
      created: 0,
      terminated: 0,
      active: 0,
      reads: 0,
      copies: [],
      deny: false
    });
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        probe.created++;
        probe.active++;
      }
      terminate() {
        probe.terminated++;
        probe.active--;
        super.terminate();
      }
      postMessage(message: unknown) {
        if (!probe.blockRequests) super.postMessage(message);
      }
    };
    const NativeReader = window.FileReader;
    window.FileReader = class extends NativeReader {
      readAsText(blob: Blob, encoding?: string) {
        probe.reads++;
        super.readAsText(blob, encoding);
      }
    };
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: async (text: string) => {
        if (probe.deny)
          throw new DOMException('blocked by test', 'NotAllowedError');
        await original(text);
        probe.copies.push(text);
      }
    });
  });
  await page.goto(path);
  await expect(
    page.getByRole('heading', { name: 'Text Workflow Builder', exact: true })
  ).toBeVisible();
});

test('literal Unicode text survives native copy, raw download, denied permission and empty-result export', async ({
  page,
  browserName
}) => {
  const text = String.raw`a\nb\t Việt 😀 <img src=x onerror="window.workflowInjected=1">`;
  await page.getByTestId('text-input').fill(`  ${text}  `);
  await run(page, text);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => Object.hasOwn(window, 'workflowInjected'))
  ).toBe(false);
  const copy = page.getByRole('button', {
    name: 'Copy final result',
    exact: true
  });
  await copy.click();
  await expect
    .poll(() => page.evaluate(() => window.orvulixWorkflowProbe.copies))
    .toEqual([text]);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      nativeClipboardText(text)
    );
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download final result' }).click();
  expect(await readFile((await (await event).path())!, 'utf8')).toBe(text);
  await page.evaluate(() => {
    window.orvulixWorkflowProbe.deny = true;
  });
  await copy.click();
  await expect(page.getByText(/Clipboard access failed/)).toBeVisible();
  await page.evaluate(() => {
    window.orvulixWorkflowProbe.deny = false;
  });
  await page.getByTestId('text-input').fill('   ');
  await expect(copy).toBeDisabled();
  await expect(page.getByTestId('workflow-result')).toHaveValue('');
  await run(page, '');
  await expect(copy).toBeEnabled();
  await copy.click();
  await expect
    .poll(() => page.evaluate(() => window.orvulixWorkflowProbe.copies))
    .toEqual([text, '']);
  const empty = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download final result' }).click();
  expect(await readFile((await (await empty).path())!, 'utf8')).toBe('');
});

test('all six transformations expose ordered intermediates and configuration-only recipe round-trip', async ({
  page
}) => {
  const steps = [trim, dedup, upper, reverse, encode('base64'), encode('url')];
  await importSteps(page, steps);
  await page.getByTestId('text-input').fill('  hello world\nhello world  ');
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(
      `${request.method()} ${request.url()} ${request.postData() ?? ''}`
    )
  );
  await run(page, 'RExST1cgT0xMRUg%3D');
  const expected = [
    'hello world\nhello world',
    'hello world',
    'HELLO WORLD',
    'DLROW OLLEH',
    'RExST1cgT0xMRUg=',
    'RExST1cgT0xMRUg%3D'
  ];
  const created = await page.evaluate(
    () => window.orvulixWorkflowProbe.created
  );
  for (const [index, value] of expected.entries()) {
    await page.getByRole('combobox', { name: /^Intermediate step/ }).click();
    await page
      .getByRole('option', { name: new RegExp(`^Step ${index + 1}:`) })
      .click();
    await expect(
      page.getByRole('textbox', {
        name: new RegExp(`^Step ${index + 1} output:`)
      })
    ).toHaveValue(value);
  }
  expect(await page.evaluate(() => window.orvulixWorkflowProbe.created)).toBe(
    created
  );
  const event = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export recipe', exact: true })
    .click();
  const download = await event;
  const recipeText = await readFile((await download.path())!, 'utf8');
  expect(JSON.parse(recipeText)).toEqual({ version: 1, steps });
  expect(recipeText).not.toContain('hello world');
  await page
    .getByRole('button', { name: 'Remove step 1', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await page
    .getByLabel('Recipe file', { exact: true })
    .setInputFiles((await download.path()) as string);
  await expect(
    page.getByRole('heading', { name: 'Workflow steps (6/16)', exact: true })
  ).toBeVisible();
  await run(page, 'RExST1cgT0xMRUg%3D');
  expect(
    requests.every(
      (value) =>
        value.startsWith('GET ') &&
        !value.includes('hello') &&
        !value.includes('RExST1cgT0xMRUg')
    )
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      [...Object.values(localStorage), ...Object.values(sessionStorage)].some(
        (value) => /hello world|RExST1cgT0xMRUg/.test(value)
      )
    )
  ).toBe(false);
});

test('invalid and oversized recipes preserve current pipeline/result; valid import invalidates it', async ({
  page
}) => {
  await page.getByTestId('text-input').fill('current');
  await run(page, 'current');
  const reads = await page.evaluate(() => window.orvulixWorkflowProbe.reads);
  await page.getByLabel('Recipe file', { exact: true }).setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(32_769, 32)
  });
  await expect(page.getByText(/Recipe is too large/)).toBeVisible();
  expect(await page.evaluate(() => window.orvulixWorkflowProbe.reads)).toBe(
    reads
  );
  await expect(page.getByTestId('workflow-result')).toHaveValue('current');
  await page.getByLabel('Recipe file', { exact: true }).setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"steps":[],"input":"private"}')
  });
  await expect(page.getByText(/Invalid recipe/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Step 1: Trim', exact: true })
  ).toBeVisible();
  await expect(page.getByTestId('workflow-result')).toHaveValue('current');
  await importSteps(page, [upper]);
  await expect(page.getByTestId('workflow-result')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await run(page, 'CURRENT');
});

test('failed steps retain only current intermediates and recover after options/source edits', async ({
  page
}) => {
  await importSteps(page, [trim, decode('url'), upper]);
  await page.getByTestId('text-input').fill('  %ZZ  ');
  await page.getByRole('button', { name: 'Run workflow' }).click();
  await expect(
    page.getByText('Step 2: Invalid URL component encoding.', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByLabel('Step 1 output: Trim', { exact: true })
  ).toHaveValue('%ZZ');
  await expect(page.getByTestId('workflow-result')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Download final result' })
  ).toBeDisabled();
  await page.getByTestId('text-input').fill('  %61  ');
  await run(page, 'A');
  await page.getByRole('combobox', { name: /^Step 2 mode\b/ }).click();
  await page.getByRole('option', { name: 'Encode', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await run(page, '%2561');
  await importSteps(page, [decode('base64')]);
  await page.getByTestId('text-input').fill('Zh==');
  await page.getByRole('button', { name: 'Run workflow' }).click();
  await expect(page.getByText(/Step 1: Invalid Base64/)).toBeVisible();
  await page.getByTestId('text-input').fill('V m n h u 4 d 0 I P C f m I A=');
  await run(page, 'Việt 😀');
  await importSteps(page, [dedup]);
  await page.getByTestId('text-input').fill(' b \na\n\nb\na\n');
  await page.getByRole('combobox', { name: /^Step 1 blank lines\b/ }).click();
  await page
    .getByRole('option', { name: 'Preserve all blank lines', exact: true })
    .click();
  await page
    .getByRole('checkbox', { name: 'Step 1: Trim lines', exact: true })
    .check();
  await page
    .getByRole('checkbox', { name: 'Step 1: Sort lines', exact: true })
    .check();
  await run(page, '\n\na\nb');
  await page
    .getByRole('combobox', { name: /^Step 1 duplicate mode\b/ })
    .click();
  await page
    .getByRole('option', { name: 'Keep only unique lines', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await run(page, '\n');
});

test('input edits and navigation terminate native workers before old replies can publish', async ({
  page
}) => {
  await importSteps(page, [reverse]);
  await page.getByTestId('text-input').fill('a'.repeat(65_536));
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent === 'Run workflow')!
      .click();
    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="text-input"]'
    )!;
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )!.set!.call(input, 'new');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.getByTestId('workflow-result')).toHaveValue('');
  await expect
    .poll(() => page.evaluate(() => window.orvulixWorkflowProbe.active))
    .toBe(0);
  expect(await page.evaluate(() => window.orvulixWorkflowProbe.created)).toBe(
    1
  );
  await run(page, 'wen');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent === 'Run workflow')!
      .click();
    document.querySelector<HTMLAnchorElement>('a[href$="/about"]')!.click();
  });
  await expect(page).toHaveURL(new RegExp(`${prefix}/about$`));
  await expect
    .poll(() => page.evaluate(() => window.orvulixWorkflowProbe.active))
    .toBe(0);
  const stats = await page.evaluate(() => window.orvulixWorkflowProbe);
  expect(stats.terminated).toBe(stats.created);
});

test('exact admission budgets remain responsive; one-over input and retained outputs recover', async ({
  page
}) => {
  await importSteps(page, Array(16).fill(upper));
  await page.getByTestId('text-input').fill('a'.repeat(65_536));
  await run(page, 'A'.repeat(65_536));
  await expect(
    page
      .getByRole('region', { name: 'Intermediate outputs' })
      .getByRole('textbox')
  ).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Add step', exact: true })
  ).toBeDisabled();
  const workers = await page.evaluate(
    () => window.orvulixWorkflowProbe.created
  );
  await page.getByTestId('text-input').fill('a'.repeat(65_537));
  await expect(
    page.getByRole('button', { name: 'Run workflow' })
  ).toBeDisabled();
  expect(await page.evaluate(() => window.orvulixWorkflowProbe.created)).toBe(
    workers
  );
  await importSteps(page, [encode('url'), ...Array(15).fill(trim)]);
  await page.getByTestId('text-input').fill(' ' + 'a'.repeat(65_535));
  await page.getByRole('button', { name: 'Run workflow' }).click();
  await expect(
    page.getByText(/Step 16: Intermediate outputs exceed/)
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await importSteps(page, [reverse]);
  await page.getByTestId('text-input').fill('A👩🏽‍💻e\u0301🇻🇳');
  await run(page, '🇻🇳e\u0301👩🏽‍💻A');
});

test('mobile dark keyboard editing preserves accessible focus and layout', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Add step' }).focus();
  await page.keyboard.press('Enter');
  const move = page.getByRole('button', { name: 'Move step 2 up' });
  await move.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Step 1: Uppercase', exact: true })
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Remove step 2', exact: true })
    .click();
  await page.getByTestId('text-input').fill('abc');
  await run(page, 'ABC');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test('Cancel and deadline terminate real workers with withheld I/O and allow recovery', async ({
  page
}) => {
  await importSteps(page, [upper]);
  await page.getByTestId('text-input').fill('recover');
  await page.evaluate(() => {
    window.orvulixWorkflowProbe.blockRequests = true;
  });
  await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.orvulixWorkflowProbe.active))
    .toBe(0);
  await expect(
    page.getByRole('button', { name: 'Copy final result' })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
  await page.waitForFunction(() => window.orvulixWorkflowProbe.active === 0);
  await expect(
    page.getByText(/Workflow timed out after 5 seconds/)
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Download final result' })
  ).toBeDisabled();
  await page.evaluate(() => {
    window.orvulixWorkflowProbe.blockRequests = false;
  });
  await run(page, 'RECOVER');
  expect(
    await page.evaluate(() => window.orvulixWorkflowProbe.terminated)
  ).toBe(3);
});

test('new route has matching static content and metadata with Pages isolation', async ({
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
        name: 'Text Workflow Builder',
        exact: true
      })
    ).toBeVisible();
    await expect(
      staticPage.getByText('Build a workflow', { exact: true })
    ).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /text transformations/i
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
        /\/string\/text-workflow$/
      );
  } finally {
    await context.close();
  }
});
