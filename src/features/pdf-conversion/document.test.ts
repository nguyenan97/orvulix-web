import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ getDocument: vi.fn(), destroy: vi.fn() }));
vi.mock('pdfjs-dist', () => ({ getDocument: fixture.getDocument }));
import { withPdfDocument } from './document';
beforeEach(() => {
  fixture.destroy.mockReset().mockResolvedValue(undefined);
  fixture.getDocument.mockReset();
  fixture.getDocument.mockReturnValue({
    promise: Promise.resolve({ numPages: 2 }),
    destroy: fixture.destroy
  });
});
afterEach(() => vi.useRealTimers());
const file = () => new File(['pdf'], 'a.pdf');
it('destroys the loading task after success and work failure', async () => {
  expect(await withPdfDocument(file(), undefined, async () => 'output')).toBe(
    'output'
  );
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  await expect(
    withPdfDocument(file(), undefined, async () => {
      throw new Error('private codec detail');
    })
  ).rejects.toThrow('Choose a readable');
  expect(fixture.destroy).toHaveBeenCalledTimes(2);
});
it('rejects oversize input before reading or creating a PDF task', async () => {
  const source = file();
  Object.defineProperty(source, 'size', { value: 32 * 1024 * 1024 + 1 });
  const read = vi.spyOn(source, 'arrayBuffer');
  await expect(
    withPdfDocument(source, undefined, async () => 'output')
  ).rejects.toThrow('32 MiB');
  expect(read).not.toHaveBeenCalled();
  expect(fixture.getDocument).not.toHaveBeenCalled();
});
it('rejects page counts above budget and destroys the document before work', async () => {
  fixture.getDocument.mockReturnValue({
    promise: Promise.resolve({ numPages: 501 }),
    destroy: fixture.destroy
  });
  const work = vi.fn();
  await expect(withPdfDocument(file(), undefined, work)).rejects.toThrow(
    '500 pages'
  );
  expect(work).not.toHaveBeenCalled();
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
it('settles cancellation even if loading never settles, and removes abort listeners', async () => {
  fixture.getDocument.mockReturnValue({
    promise: new Promise(() => undefined),
    destroy: fixture.destroy
  });
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, 'removeEventListener');
  const operation = withPdfDocument(file(), controller.signal, vi.fn());
  await vi.waitFor(() => expect(fixture.getDocument).toHaveBeenCalledTimes(1));
  controller.abort();
  await expect(operation).rejects.toThrow('cancelled');
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
});
it('settles the 30s deadline and destroys a hung PDF loading task', async () => {
  vi.useFakeTimers();
  fixture.getDocument.mockReturnValue({
    promise: new Promise(() => undefined),
    destroy: fixture.destroy
  });
  const source = file();
  vi.spyOn(source, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(3));
  const operation = withPdfDocument(source, undefined, vi.fn());
  const rejection = expect(operation).rejects.toThrow('30 second limit');
  await vi.advanceTimersByTimeAsync(30000);
  await rejection;
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it('does not create a task for a pre-aborted signal', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    withPdfDocument(file(), controller.signal, vi.fn())
  ).rejects.toThrow('cancelled');
  expect(fixture.getDocument).not.toHaveBeenCalled();
});
