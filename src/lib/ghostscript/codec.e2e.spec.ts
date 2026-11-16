import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

// Uses the existing remote Ghostscript WASM, not an offline-availability assertion.
for (const kind of ['compress', 'protect']) {
  test(`${kind} downloads a real readable PDF with retained content and password semantics`, async ({
    page
  }) => {
    const password = 'synthetic-R07-document-password';
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));
    await page.route('**/__test/pdf.mjs', (route) =>
      route.fulfill({
        path: 'node_modules/pdfjs-dist/build/pdf.mjs',
        contentType: 'text/javascript'
      })
    );
    await page.route('**/__test/pdf.worker.mjs', (route) =>
      route.fulfill({
        path: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
        contentType: 'text/javascript'
      })
    );
    const pdf = await PDFDocument.create();
    for (const text of ['R07 literal content', 'Second page'])
      pdf.addPage([200, 100]).drawText(text, { x: 10, y: 50, size: 10 });
    await page.goto(`/pdf/${kind}-pdf`);
    if (kind === 'protect') {
      await page
        .getByPlaceholder('Enter password', { exact: true })
        .fill(password);
      await page
        .getByPlaceholder('Confirm password', { exact: true })
        .fill(password);
    }
    const picker = page.locator('#tool input[type=file]');
    await picker.setInputFiles({
      name: 'input.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await pdf.save())
    });
    const button = page
      .locator('#tool')
      .getByRole('button', { name: 'Download', exact: true });
    await page.waitForFunction(
      () => !document.querySelector('#tool [role="progressbar"]')
    );
    await expect(button).toBeEnabled();
    const pending = page.waitForEvent('download');
    await button.click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(
      kind === 'protect' ? 'input-protected.pdf' : 'input.pdf'
    );
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const decoded = await page.evaluate(
      async ({ encoded, password, protectedPdf }) => {
        const modulePath = '/__test/pdf.mjs';
        const pdfjs = await import(/* @vite-ignore */ modulePath);
        pdfjs.GlobalWorkerOptions.workerSrc = '/__test/pdf.worker.mjs';
        const open = async (password: string) => {
          const data = Uint8Array.from(atob(encoded), (character) =>
            character.charCodeAt(0)
          );
          const task = pdfjs.getDocument({ data, password });
          try {
            const document = await task.promise;
            const texts: string[] = [];
            const sizes: number[][] = [];
            for (let i = 1; i <= document.numPages; i++) {
              const page = await document.getPage(i);
              const viewport = page.getViewport({ scale: 1 });
              sizes.push([viewport.width, viewport.height]);
              texts.push(
                (await page.getTextContent()).items
                  .map((item: { str?: string }) => item.str || '')
                  .join(' ')
              );
              page.cleanup();
            }
            return { opened: true, texts, sizes };
          } catch (error) {
            if ((error as Error).name === 'PasswordException')
              return { opened: false, texts: [], sizes: [] };
            throw error;
          } finally {
            await task.destroy();
          }
        };
        return {
          wrong: protectedPdf ? await open('wrong-password') : null,
          correct: await open(password)
        };
      },
      {
        encoded: bytes.toString('base64'),
        password: kind === 'protect' ? password : '',
        protectedPdf: kind === 'protect'
      }
    );
    expect(decoded.correct.opened).toBe(true);
    expect(decoded.correct.texts).toEqual([
      'R07 literal content',
      'Second page'
    ]);
    expect(decoded.correct.sizes).toEqual([
      [200, 100],
      [200, 100]
    ]);
    if (kind === 'protect') expect(decoded.wrong?.opened).toBe(false);
    expect(logs.some((line) => line.includes(password))).toBe(false);
  });
}
