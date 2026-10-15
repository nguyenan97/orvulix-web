import { PDFDocument, rgb, PDFName } from 'pdf-lib';
import { afterEach, expect, it, vi } from 'vitest';
import { mergeDocuments, MERGE_LIMITS } from './merge';
async function fixture(
  name = 'Việt Nam.pdf',
  sizes = [
    [120, 210],
    [310, 160]
  ]
) {
  const pdf = await PDFDocument.create();
  sizes.forEach(([width, height], i) => {
    const page = pdf.addPage([width, height]);
    page.drawRectangle({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      color: i ? rgb(0, 0, 1) : rgb(1, 0, 0)
    });
  });
  return new File([new Uint8Array(await pdf.save())], name, {
    type: 'application/pdf'
  });
}
afterEach(() => vi.restoreAllMocks());
it('merges actual PDFs in selection/page order with original geometry and painted streams', async () => {
  const result = await mergeDocuments([
    await fixture(),
    await fixture('second.pdf', [[90, 90]])
  ]);
  expect(result.name).toBe('merged.pdf');
  expect(result.type).toBe('application/pdf');
  const pdf = await PDFDocument.load(await result.arrayBuffer(), {
    updateMetadata: false
  });
  expect(
    pdf.getPages().map((page) => [page.getWidth(), page.getHeight()])
  ).toEqual([
    [120, 210],
    [310, 160],
    [90, 90]
  ]);
  expect(
    pdf.getPages().every((page) => !!page.node.get(PDFName.of('Contents')))
  ).toBe(true);
});
it('keeps the supported single-file merge and does not mutate selection', async () => {
  const files = [await fixture()];
  await mergeDocuments(files);
  expect(files).toHaveLength(1);
});
it.each([0, 21])(
  'rejects invalid file count %s before reading',
  async (count) => {
    const files = Array.from(
      { length: count },
      () => new File(['x'], 'a.pdf', { type: 'application/pdf' })
    );
    await expect(mergeDocuments(files)).rejects.toThrow();
  }
);
it.each([0, 32 * 1024 * 1024 + 1, NaN])(
  'rejects invalid input size %s before allocation',
  async (size) => {
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: size });
    await expect(mergeDocuments([file])).rejects.toThrow();
  }
);
it('rejects the combined input byte budget', async () => {
  const files = Array.from({ length: 5 }, () => {
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 32 * 1024 * 1024 });
    return file;
  });
  await expect(mergeDocuments(files)).rejects.toThrow('128 MiB');
});
it('rejects unsupported types, invalid PDFs and zero-page documents', async () => {
  await expect(
    mergeDocuments([new File(['x'], 'a.txt', { type: 'text/plain' })])
  ).rejects.toThrow();
  await expect(
    mergeDocuments([
      new File(['not a PDF'], 'a.pdf', { type: 'application/pdf' })
    ])
  ).rejects.toThrow();
  const pdf = await PDFDocument.create();
  await expect(
    mergeDocuments([
      new File(
        [new Uint8Array(await pdf.save({ addDefaultPage: false }))],
        'empty.pdf',
        { type: 'application/pdf' }
      )
    ])
  ).rejects.toThrow('at least one page');
});
it('accepts exactly 500 pages and rejects cumulative overflow', async () => {
  const file = await fixture(
    'many.pdf',
    Array.from({ length: 500 }, () => [20, 30])
  );
  const output = await mergeDocuments([file]);
  expect(
    (await PDFDocument.load(await output.arrayBuffer())).getPageCount()
  ).toBe(500);
  await expect(
    mergeDocuments([file, await fixture('extra.pdf', [[20, 30]])])
  ).rejects.toThrow('500 pages');
});
it('rejects already canceled work and cancels after an in-flight read', async () => {
  const file = await fixture();
  const controller = new AbortController();
  controller.abort();
  await expect(mergeDocuments([file], controller.signal)).rejects.toMatchObject(
    { name: 'AbortError' }
  );
  const next = new AbortController();
  const bytes = await file.arrayBuffer();
  vi.spyOn(file, 'arrayBuffer').mockImplementation(async () => {
    next.abort();
    return bytes;
  });
  await expect(mergeDocuments([file], next.signal)).rejects.toMatchObject({
    name: 'AbortError'
  });
  expect((await mergeDocuments([await fixture()])).size).toBeGreaterThan(0);
});
it('checks elapsed acceptance after a delayed read even without timer delivery', async () => {
  const file = await fixture();
  const bytes = await file.arrayBuffer();
  let now = 100;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(file, 'arrayBuffer').mockImplementation(async () => {
    now += MERGE_LIMITS.elapsedMs;
    return bytes;
  });
  await expect(mergeDocuments([file])).rejects.toThrow('timed out');
});
it('handles encoder failure and rejects an oversized encoded output', async () => {
  const file = await fixture();
  const save = vi.spyOn(PDFDocument.prototype, 'save');
  save.mockRejectedValueOnce(Error('encoder failed'));
  await expect(mergeDocuments([file])).rejects.toThrow('encoder failed');
  // Encoding boundary only; fidelity is exercised with unmocked bytes above/below.
  save.mockResolvedValueOnce(new Uint8Array(MERGE_LIMITS.outputBytes + 1));
  await expect(mergeDocuments([file])).rejects.toThrow('64 MiB');
  save.mockRestore();
  expect(
    (
      await PDFDocument.load(await (await mergeDocuments([file])).arrayBuffer())
    ).getPageCount()
  ).toBe(2);
});
