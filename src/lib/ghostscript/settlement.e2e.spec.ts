import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

for (const kind of ['compress', 'protect']) {
  test(`${kind} settles blocked WASM startup and supports a fresh retry`, async ({
    page
  }) => {
    let blocked = 0;
    const context = page.context();
    await context.route(
      'https://cdn-wasm.b-cdn.net/gs-worker.wasm',
      (route) => {
        blocked++;
        return route.fulfill({
          status: 503,
          body: 'Unavailable test asset',
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    );
    await page.goto(`/pdf/${kind}-pdf`);
    if (kind === 'protect') {
      await page
        .getByPlaceholder('Enter password', { exact: true })
        .fill('synthetic-password');
      await page
        .getByPlaceholder('Confirm password', { exact: true })
        .fill('synthetic-password');
    }
    const pdf = await PDFDocument.create();
    pdf.addPage([200, 100]).drawText('R07 fixture', { x: 10, y: 50, size: 10 });
    const buffer = Buffer.from(await pdf.save());
    const picker = page.locator('#tool input[type=file]');
    const output = page
      .locator('#tool')
      .getByRole('button', { name: 'Download', exact: true });
    await picker.setInputFiles({
      name: 'first.pdf',
      mimeType: 'application/pdf',
      buffer
    });
    await expect(
      page.getByRole('alert', { name: 'PDF processing error' })
    ).toContainText(/WASM|worker|failed/);
    expect(blocked).toBeGreaterThan(0);
    await expect(output).toBeDisabled();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(
      page.getByRole('alert', { name: 'PDF processing error' })
    ).toHaveCount(0);
    await picker.setInputFiles({
      name: 'retry.pdf',
      mimeType: 'application/pdf',
      buffer
    });
    await expect(
      page.getByRole('alert', { name: 'PDF processing error' })
    ).toContainText(/WASM|worker|failed/);
    await expect(output).toBeDisabled();
  });
}
