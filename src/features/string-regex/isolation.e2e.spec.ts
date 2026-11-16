import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
type ProbeWindow = { stringWorkers: number; ticks: number };

for (const tool of ['replace', 'split', 'palindrome'] as const) {
  test(`${tool} preserves downloads, times out ReDoS without blocking UI and cancels obsolete workers`, async ({
    page
  }) => {
    await page.addInitScript(() => {
      const root = window as unknown as ProbeWindow;
      root.stringWorkers = 0;
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          if (String(url).includes('string.worker-')) {
            root.stringWorkers++;
            let closed = false;
            const terminate = this.terminate.bind(this);
            this.terminate = () => {
              if (!closed) {
                root.stringWorkers--;
                closed = true;
              }
              terminate();
            };
          }
        }
      };
      root.ticks = 0;
      setInterval(() => root.ticks++, 20);
    });
    await page.goto(`/string/${tool === 'replace' ? 'replacer' : tool}`);
    await page.getByRole('radio').nth(1).check();
    const fields = page.locator('input[type=text]:visible');
    const pattern = fields.nth(1);
    const validPattern =
      tool === 'replace' ? '/abc/g' : tool === 'split' ? '\\d+' : '[:;]';
    const source =
      tool === 'replace'
        ? 'abc123abc'
        : tool === 'split'
          ? 'a1b22c'
          : 'radar:hello;anna';
    const raw =
      tool === 'replace'
        ? 'X123X'
        : tool === 'split'
          ? 'a\\nb\\nc'
          : 'true[:;]false[:;]true';
    await pattern.fill(validPattern);
    if (tool === 'replace') await fields.nth(2).fill('X');
    const input = page.getByTestId('text-input');
    const result = page.getByTestId('text-result');
    await input.fill(source);
    await expect(result).toHaveValue(tool === 'split' ? 'a\nb\nc' : raw);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await pending;
    expect(await readFile((await download.path())!, 'utf8')).toBe(raw);
    const hostile = 'a'.repeat(30) + '!';
    await pattern.fill('(a+)+$');
    await page.evaluate(() => {
      (window as unknown as ProbeWindow).ticks = 0;
    });
    await input.fill(hostile);
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers > 0
    );
    const theme = page.getByRole('button', { name: /Color theme:/ });
    const previousTheme = await theme.getAttribute('aria-label');
    await theme.click();
    await expect(theme).not.toHaveAttribute('aria-label', previousTheme!);
    // Native engines may finish with the correct no-match result before deadline.
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers === 0
    );
    const error = page.getByRole('alert', { name: 'String processing error' });
    if (await error.count()) await expect(error).toContainText('timed out');
    else
      await expect(result).toHaveValue(
        tool === 'palindrome' ? 'false' : hostile
      );

    // A genuinely stuck native worker must hit the same deadline on every engine.
    const script = '**/assets/string.worker-*.js';
    await page.route(script, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'self.onmessage=()=>{while(true){}};'
      })
    );
    await page.evaluate(() => {
      (window as unknown as ProbeWindow).ticks = 0;
    });
    await input.fill(hostile + '!');
    await expect(error).toContainText('timed out');
    expect(
      await page.evaluate(() => (window as unknown as ProbeWindow).ticks)
    ).toBeGreaterThan(20);
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers === 0
    );
    await expect(
      page.getByRole('button', { name: 'Download', exact: true })
    ).toBeDisabled();
    await page.unroute(script);
    await pattern.fill(validPattern);
    await input.fill(source);
    await expect(result).toHaveValue(tool === 'split' ? 'a\nb\nc' : raw);
    await expect(
      page.getByRole('alert', { name: 'String processing error' })
    ).toHaveCount(0);
    await page.route(script, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'self.onmessage=()=>{while(true){}};'
      })
    );
    await pattern.fill('(a+)+$');
    await input.fill(hostile);
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers > 0
    );
    await input.fill('');
    await expect(result).toHaveValue('');
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers === 0
    );
    await input.fill(hostile);
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers > 0
    );
    await page.evaluate(() => {
      history.pushState(null, '', '/');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(input).toHaveCount(0);
    await page.waitForFunction(
      () => (window as unknown as ProbeWindow).stringWorkers === 0
    );
  });
}
