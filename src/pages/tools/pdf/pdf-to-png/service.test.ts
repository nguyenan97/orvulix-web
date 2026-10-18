import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  width: 20,
  height: 20,
  cleanup: vi.fn(),
  destroy: vi.fn(),
  render: vi.fn()
}));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: fixture.destroy,
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getViewport: () => ({ width: fixture.width, height: fixture.height }),
        cleanup: fixture.cleanup,
        render: fixture.render
      })
    })
  })
}));
import { convertPdfToPngImages } from './service';
beforeEach(() => {
  fixture.width = 20;
  fixture.height = 20;
  fixture.destroy.mockReset().mockResolvedValue(undefined);
  fixture.cleanup.mockReset();
  fixture.render
    .mockReset()
    .mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D
  );
});
it('rejects null canvas output and tears down PDF/page instead of hanging', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(null)
  );
  const operation = convertPdfToPngImages(new File(['pdf'], 'test.pdf'));
  await expect(
    Promise.race([
      operation,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Hung conversion')), 100)
      )
    ])
  ).rejects.toThrow(/canvas|encode/i);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  expect(fixture.cleanup).toHaveBeenCalledTimes(1);
});
it('rejects oversized geometry before rendering', async () => {
  fixture.width = 100000;
  await expect(
    convertPdfToPngImages(new File(['pdf'], 'test.pdf'))
  ).rejects.toThrow(/pixel|dimension|4096/i);
  expect(fixture.render).not.toHaveBeenCalled();
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
