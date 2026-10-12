import { expect, test, type Page } from '@playwright/test';
const result = (page: Page) => page.getByTestId('text-result');
const options = (page: Page) =>
  page
    .getByText('Tool options', { exact: true })
    .first()
    .locator('..')
    .locator('..');
const separator = (page: Page) =>
  options(page).locator('input:not([type=radio])').first();
const regexMode = (page: Page) =>
  options(page).getByText('Use a Regex for Splitting', { exact: true });
const prepare = async (
  page: Page,
  operation: string,
  pattern = ',',
  input = 'a,b,c'
) => {
  await page.goto(`/list/${operation}`);
  await page.getByTestId('text-input').fill(input);
  await separator(page).fill(pattern);
  await regexMode(page).click();
};
for (const operation of ['shuffle', 'reverse']) {
  test(`${operation}: regex, invalid syntax, empty input and recovery`, async ({
    page
  }) => {
    await prepare(page, operation);
    await expect(result(page)).toHaveValue(
      operation === 'reverse' ? 'c\nb\na' : /^(?:[abc],){2}[abc]$/
    );
    const delimiter = separator(page);
    await delimiter.fill('[');
    await expect(page.getByRole('alert')).toContainText(/regular expression/i);
    await expect(result(page)).toHaveValue('');
    await delimiter.fill(',');
    await expect(result(page)).not.toHaveValue('');
    await page.getByTestId('text-input').fill('');
    await expect(result(page)).toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
  test(`${operation}: catastrophic input stays responsive and a new input recovers`, async ({
    page
  }) => {
    await prepare(page, operation, '(a+)+$', 'a'.repeat(80) + '!');
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
    // Engines may finish before our deadline. Neither outcome may freeze the UI.
    await expect(
      page.getByRole('button', { name: 'Cancel processing' })
    ).toHaveCount(0, { timeout: 10000 });
    await separator(page).fill(',');
    await page.getByTestId('text-input').fill('a,b,c');
    await expect(result(page)).not.toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
  test(`${operation}: stuck worker times out, cancel and edit terminate workers, navigation cleans up`, async ({
    page
  }) => {
    const script = '**/assets/list.worker-*.js';
    await page.addInitScript(() => {
      const Original = window.Worker;
      const counts = { created: 0, terminated: 0 };
      Object.assign(window, { listWorkerCounts: counts });
      window.Worker = class extends Original {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          counts.created++;
        }
        terminate() {
          counts.terminated++;
          super.terminate();
        }
      };
    });
    await page.route(script, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'self.onmessage=()=>{while(true){}};'
      })
    );
    await prepare(page, operation);
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
    await expect(page.getByRole('alert')).toContainText('timed out', {
      timeout: 10000
    });
    await page.getByTestId('text-input').fill('a,b,c,d');
    // Keyboard activation avoids waiting for layout/scroll animation within the
    // short deadline and verifies the real button's accessible interaction.
    await page
      .getByRole('button', { name: 'Cancel processing' })
      .press('Enter');
    await expect(page.getByRole('alert')).toContainText('cancelled');
    await page.getByTestId('text-input').fill('e,f');
    await options(page)
      .getByText('Use a Symbol for Splitting', { exact: true })
      .click();
    await expect(result(page)).not.toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await regexMode(page).click();
    await expect(
      page.getByRole('button', { name: 'Cancel processing' })
    ).toBeVisible();
    await page.evaluate(() => {
      history.pushState({}, '', '/about');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(
      page.getByRole('heading', { name: 'About Orvulix', exact: true })
    ).toBeVisible();
    const counts = await page.evaluate(
      () =>
        (
          window as unknown as {
            listWorkerCounts: { created: number; terminated: number };
          }
        ).listWorkerCounts
    );
    expect(counts.created).toBeGreaterThanOrEqual(4);
    expect(counts.terminated).toBe(counts.created);
    await page.unroute(script);
    await prepare(page, operation);
    await expect(result(page)).not.toHaveValue('');
  });
}

const defaultOutputs: Record<string, string> = {
  wrap: '"c","a","b","a"',
  unwrap: 'c\na\nb\na',
  rotate: 'a,c,a,b',
  truncate: 'c,a,b',
  chunk: '[c,a]\n[b,a]',
  sort: 'a,a,b,c',
  'find-unique': 'c\na\nb',
  duplicate: 'c a b a c a b a',
  'find-most-popular': 'a: 2\nb: 1\nc: 1'
};

for (const route of [
  'wrap',
  'unwrap',
  'rotate',
  'truncate',
  'chunk',
  'sort',
  'find-unique',
  'duplicate',
  'find-most-popular'
]) {
  test(`${route}: regex output matches symbol options, errors, empty input, responsiveness and recovery`, async ({
    page
  }) => {
    await page.goto(`/list/${route}`);
    await page.getByTestId('text-input').fill('c,a,b,a');
    const panel = options(page);
    const delimiter = panel
      .locator('input:not([type=radio]):not([type=checkbox])')
      .first();
    await delimiter.fill(',');
    const symbolOutput = defaultOutputs[route];
    // Wait for Formik's delimiter update before comparing against regex mode.
    await expect(result(page)).toHaveValue(symbolOutput);
    const started = page.waitForRequest((request) =>
      request.url().includes('/assets/list.worker-')
    );
    await panel.getByRole('radio').nth(1).press('Space');
    await expect(panel.getByRole('radio').nth(1)).toBeChecked();
    await started;
    await expect(result(page)).toHaveValue(symbolOutput);
    await delimiter.fill('[');
    await expect(page.getByRole('alert')).toContainText(
      'Invalid regular expression'
    );
    await expect(result(page)).toHaveValue('');
    await page.getByTestId('text-input').fill('');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await delimiter.fill('(a+)+$');
    const catastrophic = page.waitForRequest((request) =>
      request.url().includes('/assets/list.worker-')
    );
    await page.getByTestId('text-input').fill('a'.repeat(80) + '!');
    await catastrophic;
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
    await expect(
      page.getByRole('button', { name: 'Cancel processing' })
    ).toHaveCount(0, { timeout: 10000 });
    await delimiter.fill(',');
    await page.getByTestId('text-input').fill('c,a,b,a');
    await expect(result(page)).toHaveValue(symbolOutput);
    await panel.getByRole('radio').nth(0).press('Space');
    await expect(panel.getByRole('radio').nth(0)).toBeChecked();
    await expect(result(page)).toHaveValue(symbolOutput);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}
