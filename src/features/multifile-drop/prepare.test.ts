import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { inspectImage, prepareFile } from './prepare';
let images: TestImage[];
class TestImage {
  naturalWidth = 100;
  naturalHeight = 100;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  src = '';
  removeAttribute = vi.fn();
  constructor() {
    images.push(this);
  }
}
beforeEach(() => {
  images = [];
  vi.useFakeTimers();
  vi.stubGlobal('Image', TestImage);
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:probe');
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const image = () => new File(['valid'], 'a.png', { type: 'image/png' });
it('releases metadata URLs on success/error, validates geometry and allows recovery', async () => {
  const good = inspectImage(image(), new AbortController().signal);
  images[0].onload!();
  await good;
  const bad = inspectImage(image(), new AbortController().signal);
  images[1].naturalWidth = 9000;
  images[1].onload!();
  await expect(bad).rejects.toThrow(/8192/);
  const failed = inspectImage(image(), new AbortController().signal);
  images[2].onerror!();
  await expect(failed).rejects.toThrow(/decoded/);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  expect(vi.getTimerCount()).toBe(0);
});
it('aborts or times out image readiness and removes handlers/timers', async () => {
  const controller = new AbortController();
  const pending = inspectImage(image(), controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  const stuck = inspectImage(image(), new AbortController().signal);
  const rejection = expect(stuck).rejects.toThrow(/timed out/);
  await vi.advanceTimersByTimeAsync(15000);
  await rejection;
  expect(
    images.every((img) => img.onload === null && img.onerror === null)
  ).toBe(true);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
it('parses genuine PDF bytes before publication and rejects malformed/empty documents', async () => {
  vi.useRealTimers();
  const pdf = await PDFDocument.create();
  pdf.addPage([100, 200]);
  const bytes = await pdf.save();
  const file = new File([new Uint8Array(bytes)], 'a.pdf', {
    type: 'application/pdf'
  });
  await expect(
    prepareFile(file, 'pdf', new AbortController().signal)
  ).resolves.toBe(file);
  await expect(
    prepareFile(
      new File(['not a pdf'], 'bad.pdf'),
      'pdf',
      new AbortController().signal
    )
  ).rejects.toThrow();
  const empty = await PDFDocument.create();
  const noPages = await empty.save({ addDefaultPage: false });
  await expect(
    prepareFile(
      new File([new Uint8Array(noPages)], 'empty.pdf'),
      'pdf',
      new AbortController().signal
    )
  ).rejects.toThrow(/page/);
});
it('does not force FFmpeg-compatible audio/video through native playback metadata', async () => {
  for (const kind of ['audio', 'video'] as const) {
    const file = new File(['codec fixture'], 'input');
    await expect(
      prepareFile(file, kind, new AbortController().signal)
    ).resolves.toBe(file);
  }
  expect(images).toHaveLength(0);
});
