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
it.each([
  'abort',
  'normalization-error',
  'concat-error',
  'output-limit'
] as const)(
  'mixed %s cleans every written/encoded path and leaves the shared queue reusable',
  async (outcome) => {
    const { default: Jimp } = await import('jimp');
    const { imagesToGif } = await import(
      '../../pages/tools/video/gif/images-to-gif/service'
    );
    const { runFFmpegTask } = await import('../../lib/ffmpeg');
    const png = await new Jimp(32, 32, 0xff0000ff).getBufferAsync(
      Jimp.MIME_PNG
    );
    const jpeg = await new Jimp(32, 32, 0x0000ffff).getBufferAsync(
      Jimp.MIME_JPEG
    );
    const files = [
      new File([new Uint8Array(png)], 'a.png'),
      new File([new Uint8Array(jpeg)], 'b.jpg')
    ];
    const controller = new AbortController();
    fake.exec.mockImplementation(async (args: string[]) => {
      if (outcome === 'abort') controller.abort();
      if (
        outcome === 'normalization-error' ||
        (outcome === 'concat-error' && args.includes('concat'))
      )
        return 1;
      return 0;
    });
    fake.readFile.mockImplementation(async (name: string) =>
      name.endsWith('.png')
        ? new Uint8Array(png)
        : new Uint8Array(outcome === 'output-limit' ? 33 * 1024 * 1024 : 3)
    );
    const work = imagesToGif(
      files,
      { frameRateMode: 'fps', frameRateValue: 10 },
      controller.signal
    );
    if (outcome === 'abort')
      await expect(work).rejects.toMatchObject({ name: 'AbortError' });
    else
      await expect(work).rejects.toThrow(
        outcome === 'normalization-error'
          ? /could not be decoded/
          : outcome === 'concat-error'
            ? /encoding failed/
            : /32 MiB/
      );
    const deleted = new Set(fake.deleteFile.mock.calls.map((c) => c[0]));
    for (const [name] of fake.writeFile.mock.calls)
      expect(deleted.has(name)).toBe(true);
    for (const [args] of fake.exec.mock.calls)
      expect(deleted.has(args.at(-1))).toBe(true);
    expect([...deleted].some((n) => String(n).endsWith('.gif'))).toBe(true);
    expect(fake.terminate).not.toHaveBeenCalled();
    await expect(runFFmpegTask(async () => 'next caller')).resolves.toBe(
      'next caller'
    );
  }
);
it.each([
  { frameRateMode: 'fps' as const, frameRateValue: 0 },
  { frameRateMode: 'fps' as const, frameRateValue: Infinity },
  { frameRateMode: 'delay' as const, frameRateValue: 10 },
  { frameRateMode: 'delay' as const, frameRateValue: '' as const }
])(
  'rejects invalid timing before shared engine admission: %j',
  async (options) => {
    const { imagesToGif } = await import(
      '../../pages/tools/video/gif/images-to-gif/service'
    );
    await expect(imagesToGif([file()], options)).rejects.toThrow();
    expect(fake.load).not.toHaveBeenCalled();
    expect(fake.exec).not.toHaveBeenCalled();
  }
);
