import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ImportSession } from './import-session';
import { InputFile, isAcceptedFile, validateBatch, LIMITS } from './policy';
const file = (name = 'a.png', type = 'image/png', size = 1) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const identity = async (f: File) => f;
let publish = vi.fn<(value: InputFile[]) => void>();
let busy = vi.fn<(value: boolean) => void>();
let session: ImportSession;
beforeEach(() => {
  publish = vi.fn();
  busy = vi.fn();
  let i = 0;
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => `blob:${++i}`);
      static revokeObjectURL = vi.fn();
    }
  );
  session = new ImportSession(publish, busy);
});
afterEach(() => {
  session.dispose();
  vi.unstubAllGlobals();
});
describe('picker/drop contract', () => {
  it('matches MIME, extension, wildcard and empty MIME without treating labels as content validation', () => {
    expect(isAcceptedFile(file('a.PNG', ''), ['image/png'])).toBe(true);
    expect(isAcceptedFile(file('a.pdf', ''), ['application/pdf'])).toBe(true);
    expect(isAcceptedFile(file('a.heic', ''), ['image/*'])).toBe(true);
    expect(isAcceptedFile(file('a.wav', ''), ['audio/*'])).toBe(true);
    expect(isAcceptedFile(file('a.webm', ''), ['video/*'])).toBe(true);
    expect(
      isAcceptedFile(file('a.wav', 'application/octet-stream'), ['.wav'])
    ).toBe(true);
    expect(isAcceptedFile(file('a.png', 'text/plain'), ['image/*'])).toBe(
      false
    );
    expect(isAcceptedFile(file('a.exe', ''), ['image/*'])).toBe(false);
  });
  it.each(['image', 'pdf', 'audio', 'video'] as const)(
    'validates %s exact budgets and rejects empty/oversized/mixed input atomically',
    (kind) => {
      const limits = LIMITS[kind];
      const good = file('a', 'image/png', limits.file);
      expect(() => validateBatch([good], [], kind, [])).not.toThrow();
      expect(() => validateBatch([file('a', '', 0)], [], kind, [])).toThrow(
        /non-empty/
      );
      expect(() =>
        validateBatch([file('a', '', limits.file + 1)], [], kind, [])
      ).toThrow(/MiB/);
      expect(() =>
        validateBatch(
          Array.from({ length: limits.count + 1 }, () => file()),
          [],
          kind,
          []
        )
      ).toThrow(/files/);
      const current = Array.from(
        { length: limits.total / limits.file },
        () => good
      );
      expect(() => validateBatch([file()], current, kind, [])).toThrow(
        /combined/
      );
      expect(() =>
        validateBatch([file(), file('bad.txt', 'text/plain')], [], kind, [
          'image/png'
        ])
      ).toThrow(/No files/);
    }
  );
  it('serializes concurrent batches, preserves repeated files and avoids order collisions after remove', async () => {
    let release!: (f: File) => void;
    const first = file();
    const a = session.add(
      [first, first],
      'image',
      ['image/png'],
      (f) =>
        new Promise((resolve) => {
          release = () => resolve(f);
        })
    );
    await Promise.resolve();
    const b = session.add([file('b.png')], 'image', ['image/png'], identity);
    release(first);
    await Promise.resolve();
    await Promise.resolve();
    release(first);
    await a;
    await b;
    expect(
      publish.mock.calls
        .at(-1)![0]
        .map((item: InputFile) => [item.file.name, item.order])
    ).toEqual([
      ['a.png', 0],
      ['a.png', 1],
      ['b.png', 2]
    ]);
    session.remove(1);
    await session.add([file('c.png')], 'image', ['image/png'], identity);
    expect(
      publish.mock.calls.at(-1)![0].map((item: InputFile) => item.order)
    ).toEqual([0, 2, 3]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:2');
  });
  it('counts pending reservations before launching the next decoder', async () => {
    const pending = session.add(
      Array.from({ length: 20 }, () => file()),
      'image',
      ['image/png'],
      async (f, signal) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true
          })
        )
    );
    await Promise.resolve();
    expect(() =>
      session.add([file()], 'image', ['image/png'], identity)
    ).toThrow(/20/);
    session.clear();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(publish).toHaveBeenCalledWith([]);
  });
  it.each(['clear', 'reset', 'unmount'] as const)(
    'ignores late publication after %s and reclaims previews',
    async (action) => {
      await session.add([file()], 'image', ['image/png'], identity);
      let release!: (f: File) => void;
      const pending = session.add(
        [file('late.png')],
        'image',
        ['image/png'],
        () =>
          new Promise((resolve) => {
            release = resolve;
          })
      );
      await Promise.resolve();
      if (action === 'clear') session.clear();
      else if (action === 'reset') session.sync([]);
      else session.dispose();
      const calls = publish.mock.calls.length;
      release(file('late.png'));
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(publish).toHaveBeenCalledTimes(calls);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    }
  );
  it('does not publish a partially prepared batch, clears processing and recovers', async () => {
    const prepare = vi
      .fn()
      .mockResolvedValueOnce(file())
      .mockRejectedValueOnce(Error('Invalid image metadata'));
    await expect(
      session.add([file(), file('bad.png')], 'image', ['image/png'], prepare)
    ).rejects.toThrow(/metadata/);
    expect(publish).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(busy).toHaveBeenLastCalledWith(false);
    await session.add([file()], 'image', ['image/png'], identity);
    expect(publish).toHaveBeenCalledOnce();
  });
});
