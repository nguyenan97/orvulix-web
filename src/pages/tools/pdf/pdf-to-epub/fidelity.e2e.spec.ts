import { expect, test } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';

test('EPUB download preserves literal PDF text and well-formed Unicode metadata', async ({
  page
}) => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const text of ['A & B <b>literal</b> "quotes"', 'Second page']) {
    pdf.addPage([300, 200]).drawText(text, { x: 10, y: 100, size: 10, font });
  }
  await page.goto('/pdf/pdf-to-epub');
  await page.locator('#tool input[type=file]').setInputFiles({
    name: 'Nguyễn & An <draft>.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  });
  const button = page
    .locator('#tool')
    .getByRole('button', { name: 'Download', exact: true });
  await expect(button).toBeEnabled();
  const pending = page.waitForEvent('download');
  await button.click();
  const zip = await JSZip.loadAsync(
    await readFile((await (await pending).path())!)
  );
  expect(await zip.file('mimetype')!.async('string')).toBe(
    'application/epub+zip'
  );
  const names = [
    'OEBPS/content.opf',
    'OEBPS/toc.ncx',
    'OEBPS/chapter1.xhtml',
    'OEBPS/chapter2.xhtml'
  ];
  const sources = await Promise.all(
    names.map((name) => zip.file(name)!.async('string'))
  );
  const documents = await page.evaluate(
    (sources) =>
      sources.map((source) => {
        const doc = new DOMParser().parseFromString(source, 'application/xml');
        return {
          error: !!doc.querySelector('parsererror'),
          title: doc.querySelector('title, docTitle text')?.textContent,
          body: doc.querySelector('body')?.textContent,
          active: doc.querySelectorAll('script, img, a, b').length,
          chapters: doc.querySelectorAll('spine itemref').length
        };
      }),
    sources
  );
  expect(documents.every((doc) => !doc.error)).toBe(true);
  expect(documents[0].chapters).toBe(2);
  expect(sources[0]).toContain('Nguyễn &amp; An &lt;draft&gt;');
  expect(documents[1].title).toBe('Nguyễn & An <draft>');
  expect(documents[2].body).toContain('A & B <b>literal</b> "quotes"');
  expect(documents[2].active).toBe(0);
  expect(documents[3].body).toContain('Second page');
});
