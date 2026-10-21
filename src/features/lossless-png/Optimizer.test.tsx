import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Optimizer from './Optimizer';
import { runOptimization } from './runner';
vi.mock('./runner', () => ({ runOptimization: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:current'),
    revokeObjectURL: vi.fn()
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function setup() {
  const view = render(<Optimizer />);
  const choose = (name = 'same.png') =>
    fireEvent.change(screen.getByLabelText('Choose a PNG (up to 4 MiB)'), {
      target: { files: [new File([new Uint8Array(100)], name)] }
    });
  const run = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Optimize PNG' }));
  return { ...view, choose, run };
}
it('requires a gesture, downloads current output and releases URLs on replacement/clear/unmount', async () => {
  vi.mocked(runOptimization).mockResolvedValue(new ArrayBuffer(60));
  const s = setup();
  s.choose('test.html');
  expect(runOptimization).not.toHaveBeenCalled();
  s.run();
  const download = await screen.findByRole('link', { name: 'Download PNG' });
  expect(download).toHaveAttribute('download', 'test.html.png');
  s.choose();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:current');
  s.run();
  await screen.findByRole('link');
  fireEvent.click(screen.getByRole('button', { name: 'Clear file' }));
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  s.choose();
  s.run();
  await screen.findByRole('link');
  s.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
});
it.each(['cancel', 'clear', 'replace', 'unmount'])(
  'ignores delayed success and failure after %s',
  async (action) => {
    let resolve!: (bytes: ArrayBuffer) => void, reject!: (error: Error) => void;
    vi.mocked(runOptimization).mockImplementation(
      () =>
        new Promise((a, b) => {
          resolve = a;
          reject = b;
        })
    );
    const s = setup();
    s.choose();
    s.run();
    const signal = vi.mocked(runOptimization).mock.calls.at(-1)![1];
    if (action === 'cancel')
      fireEvent.click(
        screen.getByRole('button', { name: 'Cancel optimization' })
      );
    if (action === 'clear')
      fireEvent.click(screen.getByRole('button', { name: 'Clear file' }));
    if (action === 'replace') s.choose('replacement.png');
    if (action === 'unmount') s.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(new ArrayBuffer(60));
      reject(Error('stale'));
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByText('stale')).not.toBeInTheDocument();
  }
);
it('keeps original, reports a current failure and retries the same file', async () => {
  vi.mocked(runOptimization)
    .mockRejectedValueOnce(Error('Invalid PNG'))
    .mockResolvedValueOnce(new ArrayBuffer(100));
  const s = setup();
  s.choose();
  s.run();
  await screen.findByText('Invalid PNG');
  s.choose();
  s.run();
  await screen.findByText(/Original kept:/);
  expect(screen.queryByText('Invalid PNG')).not.toBeInTheDocument();
});
