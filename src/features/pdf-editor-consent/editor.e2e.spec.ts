import { expect, test, type BrowserContext } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const prefix = process.env.CONSENT_TEST_PREFIX ?? '';
const path = (route: string) => prefix + route;
const editorTitle = 'SimplePDF editor (external service)';
const fixture = `<!doctype html><html><body><h1>Controlled external editor fixture</h1>
<label>Fixture PDF<input type="file" accept="application/pdf"></label><output aria-label="Fixture bytes"></output>
<script>document.querySelector('input').onchange=async event=>{const file=event.target.files[0];document.querySelector('output').textContent=String((await file.arrayBuffer()).byteLength);};</script>
</body></html>`;
async function provider(context: BrowserContext, fail = false) {
  const requests: string[] = [];
  await context.route(
    (url) =>
      url.hostname === 'simplepdf.com' ||
      url.hostname.endsWith('.simplepdf.com'),
    async (route) => {
      requests.push(route.request().url());
      if (fail) await route.abort('failed');
      else await route.fulfill({ contentType: 'text/html', body: fixture });
    }
  );
  return requests;
}
test('external editor is off until keyboard opt-in, handles a fixture PDF and closes with focus retained', async ({
  page,
  context
}) => {
  const requests = await provider(context);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path('/pdf/editor'));
  const enable = page.getByRole('button', { name: 'Enable SimplePDF editor' });
  await expect(enable).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(requests).toEqual([]);
  await expect(
    page.getByRole('link', { name: 'SimplePDF privacy policy' })
  ).toHaveAttribute('href', 'https://simplepdf.com/privacy');
  await enable.focus();
  await page.keyboard.press('Enter');
  const iframe = page.getByTitle(editorTitle);
  await expect(iframe).toHaveAttribute(
    'src',
    'https://react-editor.simplepdf.com/en/editor'
  );
  await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
  const frame = page.frameLocator('iframe');
  await expect(
    frame.getByRole('heading', { name: 'Controlled external editor fixture' })
  ).toBeVisible();
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 400]);
  const bytes = await pdf.save();
  await frame.getByLabel('Fixture PDF').setInputFiles({
    name: 'synthetic.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(bytes)
  });
  await expect(frame.getByLabel('Fixture bytes')).toHaveText(
    String(bytes.length)
  );
  expect(requests).toEqual(['https://react-editor.simplepdf.com/en/editor']);
  const close = page.getByRole('button', { name: 'Close SimplePDF editor' });
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(iframe).toHaveCount(0);
  await expect(enable).toBeFocused();
  await enable.click();
  await expect(
    frame.getByRole('heading', { name: 'Controlled external editor fixture' })
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(errors).toEqual([]);
});
test('reload, navigation and a new visit do not persist permission', async ({
  page,
  context
}) => {
  const requests = await provider(context);
  await page.goto(path('/pdf/editor'));
  await page.getByRole('button', { name: 'Enable SimplePDF editor' }).click();
  await expect(
    page
      .frameLocator('iframe')
      .getByRole('heading', { name: 'Controlled external editor fixture' })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Enable SimplePDF editor' })
  ).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(requests).toHaveLength(1);
  await expect(
    page.getByRole('link', { name: 'Browse other PDF tools' })
  ).toHaveAttribute('href', path('/categories/pdf'));
  await page.getByRole('link', { name: 'Browse other PDF tools' }).click();
  await expect(page).toHaveURL(new RegExp(prefix + '/categories/pdf$'));
  await page.goto(path('/pdf/editor'));
  await expect(
    page.getByRole('button', { name: 'Enable SimplePDF editor' })
  ).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});
test('mobile dark layout and failed provider keep close/recovery controls available', async ({
  page,
  context
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  const requests = await provider(context, true);
  await page.goto(path('/pdf/editor'));
  await page.getByRole('button', { name: 'Enable SimplePDF editor' }).click();
  await expect.poll(() => requests.length).toBe(1);
  await page.getByRole('button', { name: 'Close SimplePDF editor' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await context.unrouteAll({ behavior: 'wait' });
  const recovery = await provider(context);
  await page.getByRole('button', { name: 'Enable SimplePDF editor' }).click();
  await expect(
    page
      .frameLocator('iframe')
      .getByRole('heading', { name: 'Controlled external editor fixture' })
  ).toBeVisible();
  expect(recovery).toHaveLength(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
test('static disclosure is visible without JavaScript and retains production or Pages metadata', async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const requests = await provider(context);
    const page = await context.newPage();
    await page.goto(baseURL + path('/pdf/editor'));
    await expect(
      page.getByText(/The editor is hosted by SimplePDF/)
    ).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(requests).toEqual([]);
    if (prefix) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /noindex/
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    } else
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://orvulix.io.vn/pdf/editor'
      );
  } finally {
    await context.close();
  }
});
