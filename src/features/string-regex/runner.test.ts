import { afterEach, expect, it, vi } from 'vitest';
import { runString, type StringWorker } from './runner';
import type { StringRequest } from './model';
import { initialValues } from '../../pages/tools/string/text-replacer/initialValues';
const request: StringRequest = {
  tool: 'replace',
  input: 'abc',
  options: {
    ...initialValues,
    mode: 'regexp',
    searchRegexp: '(a+)+$',
    replaceValue: 'x'
  }
};
const worker = (): StringWorker => ({
  onmessage: null,
  onerror: null,
  onmessageerror: null,
  postMessage: vi.fn(),
  terminate: vi.fn()
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('does not compile the user pattern in the UI runner, then terminates on success', async () => {
  const construct = vi.spyOn(globalThis, 'RegExp');
  const fake = worker();
  const operation = runString(request, new AbortController().signal, {
    createWorker: () => fake
  });
  expect(construct).not.toHaveBeenCalled();
  fake.onmessage?.({ data: { ok: true, result: 'abc' } } as MessageEvent);
  expect(await operation).toBe('abc');
  expect(fake.terminate).toHaveBeenCalledTimes(1);
  expect(fake.onmessage).toBeNull();
});
it('times out catastrophic work and releases every callback/timer', async () => {
  vi.useFakeTimers();
  const fake = worker();
  const operation = runString(request, new AbortController().signal, {
    createWorker: () => fake
  });
  const rejection = expect(operation).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(2000);
  await rejection;
  expect(fake.terminate).toHaveBeenCalledTimes(1);
  expect(fake.onmessage).toBeNull();
  expect(fake.onerror).toBeNull();
  expect(fake.onmessageerror).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});
it('aborts and removes its listener without accepting a late message', async () => {
  const fake = worker();
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, 'removeEventListener');
  const operation = runString(request, controller.signal, {
    createWorker: () => fake
  });
  const reject = expect(operation).rejects.toThrow('cancelled');
  controller.abort();
  await reject;
  expect(fake.terminate).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
});
it.each([
  'error',
  'messageerror',
  'malformed',
  'oversized',
  'worker-failure',
  'post-failure'
])('settles %s safely', async (mode) => {
  const fake = worker();
  if (mode === 'post-failure')
    vi.mocked(fake.postMessage).mockImplementation(() => {
      throw new Error('Synthetic transfer error');
    });
  const operation = runString(request, new AbortController().signal, {
    createWorker: () => fake
  });
  const rejection = expect(operation).rejects.toThrow();
  if (mode === 'error')
    fake.onerror?.({ preventDefault: vi.fn() } as unknown as ErrorEvent);
  if (mode === 'messageerror') fake.onmessageerror?.({} as MessageEvent);
  if (mode === 'malformed')
    fake.onmessage?.({ data: { ok: true, result: 42 } } as MessageEvent);
  if (mode === 'oversized')
    fake.onmessage?.({
      data: { ok: true, result: 'a'.repeat(1048577) }
    } as MessageEvent);
  if (mode === 'worker-failure')
    fake.onmessage?.({
      data: { ok: false, error: 'Invalid pattern' }
    } as MessageEvent);
  await rejection;
  expect(fake.terminate).toHaveBeenCalledTimes(1);
});
it('fails admission/startup/pre-abort without a fallback regex execution', async () => {
  const createWorker = vi.fn(() => {
    throw new Error('Blocked worker');
  });
  await expect(
    runString(request, new AbortController().signal, { createWorker })
  ).rejects.toThrow('Could not start');
  const controller = new AbortController();
  controller.abort();
  createWorker.mockClear();
  await expect(
    runString(request, controller.signal, { createWorker })
  ).rejects.toThrow('cancelled');
  await expect(
    runString(
      { ...request, input: 'a'.repeat(65537) },
      new AbortController().signal,
      { createWorker }
    )
  ).rejects.toThrow('Input');
  expect(createWorker).not.toHaveBeenCalled();
});
