import { beforeEach, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({
  ready: false,
  load: vi.fn<() => Promise<void>>(),
  terminate: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  exec: vi.fn(),
  deleteFile: vi.fn(),
  fetch: vi.fn()
}));
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    get loaded() {
      return fake.ready;
    }
    load = fake.load;
    terminate = fake.terminate;
    writeFile = fake.writeFile;
    readFile = fake.readFile;
    exec = fake.exec;
    deleteFile = fake.deleteFile;
  }
}));
vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn(async () => 'blob:core'),
  fetchFile: fake.fetch
}));
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  fake.ready = false;
  fake.load.mockImplementation(async () => {
    fake.ready = true;
  });
  fake.fetch.mockResolvedValue(new Uint8Array([1]));
  fake.readFile.mockResolvedValue(new Uint8Array([71, 73, 70]));
  fake.writeFile.mockResolvedValue(undefined);
  fake.exec.mockResolvedValue(0);
  fake.deleteFile.mockResolvedValue(undefined);
});
const file = () => new File(['image'], 'source.png', { type: 'image/png' });
it('rejects before load/admission without starting a shared worker', async () => {
  const { runFFmpegTask } = await import('../../lib/ffmpeg');
  const controller = new AbortController();
  controller.abort();
  const body = vi.fn();
  await expect(runFFmpegTask(body, controller.signal)).rejects.toMatchObject({
    name: 'AbortError'
  });
  expect(fake.load).not.toHaveBeenCalled();
  expect(body).not.toHaveBeenCalled();
});
it('cancellation during shared load does not reset the worker or break a no-signal caller', async () => {
  let release!: () => void;
  fake.load.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => {
          fake.ready = true;
          resolve();
        };
      })
  );
  const { runFFmpegTask } = await import('../../lib/ffmpeg');
  const controller = new AbortController();
  const canceled = vi.fn();
  const other = vi.fn(async () => 'other');
  const a = runFFmpegTask(canceled, controller.signal);
  const b = runFFmpegTask(other);
  await vi.waitFor(() => expect(fake.load).toHaveBeenCalledOnce());
  controller.abort();
  release();
  await expect(a).rejects.toMatchObject({ name: 'AbortError' });
  await expect(b).resolves.toBe('other');
  expect(canceled).not.toHaveBeenCalled();
  expect(fake.load).toHaveBeenCalledOnce();
  expect(fake.terminate).not.toHaveBeenCalled();
});
it('skips an aborted queued GIF body while retaining FIFO and default callers', async () => {
  const { runFFmpegTask } = await import('../../lib/ffmpeg');
  const { imagesToGif } = await import(
    '../../pages/tools/video/gif/images-to-gif/service'
  );
  let release!: () => void;
  const entered = vi.fn();
  const a = runFFmpegTask(async () => {
    entered();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return 'first';
  });
  await vi.waitFor(() => expect(entered).toHaveBeenCalledOnce());
  const controller = new AbortController();
  const b = imagesToGif(
    [file()],
    { frameRateMode: 'fps', frameRateValue: 10 },
    controller.signal
  );
  const last = vi.fn(async () => 'last');
  const c = runFFmpegTask(last);
  await Promise.resolve();
  controller.abort();
  release();
  await expect(a).resolves.toBe('first');
  await expect(b).rejects.toMatchObject({ name: 'AbortError' });
  await expect(c).resolves.toBe('last');
  expect(fake.writeFile).not.toHaveBeenCalled();
  expect(fake.exec).not.toHaveBeenCalled();
  expect(fake.terminate).not.toHaveBeenCalled();
});
it.each(['fetch', 'write', 'exec', 'read', 'cleanup'] as const)(
  'active abort after %s drops the result and cleans all reserved files',
  async (boundary) => {
    const controller = new AbortController();
    const { imagesToGif } = await import(
      '../../pages/tools/video/gif/images-to-gif/service'
    );
    const abort = () => controller.abort();
    if (boundary === 'fetch')
      fake.fetch.mockImplementationOnce(async () => {
        abort();
        return new Uint8Array([1]);
      });
    if (boundary === 'write')
      fake.writeFile.mockImplementationOnce(async () => {
        abort();
      });
    if (boundary === 'exec')
      fake.exec.mockImplementationOnce(async () => {
        abort();
        return 0;
      });
    if (boundary === 'cleanup')
      fake.deleteFile.mockImplementationOnce(async () => {
        abort();
      });
    if (boundary === 'read')
      fake.readFile.mockImplementationOnce(async () => {
        abort();
        return new Uint8Array([71]);
      });
    await expect(
      imagesToGif(
        [file()],
        { frameRateMode: 'fps', frameRateValue: 10 },
        controller.signal
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(
      fake.deleteFile.mock.calls
        .map((call) => call[0])
        .some((name) => String(name).endsWith('.gif'))
    ).toBe(true);
    expect(fake.deleteFile).toHaveBeenCalledTimes(3);
    expect(fake.terminate).not.toHaveBeenCalled();
    if (boundary === 'fetch' || boundary === 'write')
      expect(fake.exec).not.toHaveBeenCalled();
    if (boundary === 'exec') expect(fake.readFile).not.toHaveBeenCalled();
  }
);
it('cleans temporary files on encoder failure and subsequent no-signal GIF conversion recovers', async () => {
  const { imagesToGif } = await import(
    '../../pages/tools/video/gif/images-to-gif/service'
  );
  fake.exec.mockRejectedValueOnce(Error('encoder failed'));
  await expect(
    imagesToGif([file()], { frameRateMode: 'delay', frameRateValue: 200 })
  ).rejects.toThrow(/encoder failed/);
  expect(fake.deleteFile).toHaveBeenCalledTimes(3);
  await expect(
    imagesToGif([file()], { frameRateMode: 'fps', frameRateValue: 10 })
  ).resolves.toMatchObject({ name: 'animated.gif', type: 'image/gif' });
  expect(fake.deleteFile).toHaveBeenCalledTimes(6);
});
it('failed shared loading rejects normally and a later default caller can retry', async () => {
  const { runFFmpegTask } = await import('../../lib/ffmpeg');
  fake.load.mockRejectedValueOnce(Error('load failed'));
  await expect(runFFmpegTask(async () => 'unused')).rejects.toThrow(
    /load failed/
  );
  await expect(runFFmpegTask(async () => 'recovered')).resolves.toBe(
    'recovered'
  );
  expect(fake.load).toHaveBeenCalledTimes(2);
});
