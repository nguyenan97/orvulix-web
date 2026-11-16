import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  width: 20,
  height: 20,
  pages: 1,
  cleanup: vi.fn(),
  destroy: vi.fn(),
  render: vi.fn()
}));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: fixture.destroy,
    promise: Promise.resolve({
      numPages: fixture.pages,
      getPage: async () => ({
        getViewport: () => ({ width: fixture.width, height: fixture.height }),
        cleanup: fixture.cleanup,
        render: fixture.render
      })
    })
  })
}));
import { convertPdfToPngImages } from './service';
vi.mock('jszip', () => ({
  default: class {
    file() {}
    async generateAsync() {
      return new ArrayBuffer(3);
    }
  }
}));
afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  fixture.width = 20;
  fixture.height = 20;
  fixture.pages = 1;
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

it.each([NaN, Infinity, 0, -2, 4097])(
  'rejects invalid canvas dimension %s before render',
  async (width) => {
    fixture.width = width;
    await expect(
      convertPdfToPngImages(new File(['pdf'], 'test.pdf'))
    ).rejects.toThrow(/pixel/);
    expect(fixture.render).not.toHaveBeenCalled();
    expect(fixture.cleanup).toHaveBeenCalledTimes(1);
  }
);

it('enforces aggregate pixel admission before rendering a fifth 8 Mi-pixel page', async () => {
  fixture.width = 2048;
  fixture.height = 4096;
  fixture.pages = 5;
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(new Blob(['png']))
  );
  await expect(
    convertPdfToPngImages(new File(['pdf'], 'test.pdf'))
  ).rejects.toThrow('32 Mi pixels');
  expect(fixture.render).toHaveBeenCalledTimes(4);
  expect(fixture.cleanup).toHaveBeenCalledTimes(5);
});

it('cancels an active render, settles and releases canvas/page/document', async () => {
  let rejectRender: (error: Error) => void = () => undefined;
  const cancel = vi.fn(() => rejectRender(new Error('Cancelled render')));
  fixture.render.mockReturnValue({
    promise: new Promise((_, reject) => {
      rejectRender = reject;
    }),
    cancel
  });
  const controller = new AbortController();
  const operation = convertPdfToPngImages(
    new File(['pdf'], 'test.pdf'),
    controller.signal
  );
  const rejection = expect(operation).rejects.toThrow('cancelled');
  await vi.waitFor(() => expect(fixture.render).toHaveBeenCalledTimes(1));
  const canvas = fixture.render.mock.calls[0][0].canvas as HTMLCanvasElement;
  controller.abort();
  await rejection;
  await vi.waitFor(() => expect(fixture.cleanup).toHaveBeenCalledTimes(1));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect([canvas.width, canvas.height]).toEqual([0, 0]);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});

it('returns blobs without allocating unused URLs and clears successful canvases', async () => {
  const create = vi.spyOn(URL, 'createObjectURL');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(new Blob(['png'], { type: 'image/png' }))
  );
  const output = await convertPdfToPngImages(new File(['pdf'], 'test.pdf'));
  expect(Object.keys(output.images[0])).toEqual(['blob', 'filename']);
  expect(create).not.toHaveBeenCalled();
  const canvas = fixture.render.mock.calls[0][0].canvas as HTMLCanvasElement;
  expect([canvas.width, canvas.height]).toEqual([0, 0]);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});

it('releases the canvas on cancellation while the encoder callback is pending', async () => {
  const encode = vi
    .spyOn(HTMLCanvasElement.prototype, 'toBlob')
    .mockImplementation(() => undefined);
  const controller = new AbortController();
  const operation = convertPdfToPngImages(
    new File(['pdf'], 'test.pdf'),
    controller.signal
  );
  const rejection = expect(operation).rejects.toThrow('cancelled');
  await vi.waitFor(() => expect(encode).toHaveBeenCalledTimes(1));
  controller.abort();
  await rejection;
  await vi.waitFor(() => expect(fixture.cleanup).toHaveBeenCalledTimes(1));
  const canvas = fixture.render.mock.calls[0][0].canvas as HTMLCanvasElement;
  expect([canvas.width, canvas.height]).toEqual([0, 0]);
});

it('rejects encoded output above 64 MiB before retaining it', async () => {
  const blob = new Blob(['png']);
  Object.defineProperty(blob, 'size', { value: 64 * 1024 * 1024 + 1 });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(blob)
  );
  await expect(
    convertPdfToPngImages(new File(['pdf'], 'test.pdf'))
  ).rejects.toThrow('PNG output limit');
  expect(fixture.cleanup).toHaveBeenCalledTimes(1);
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
