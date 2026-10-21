import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import BatchOcr from './BatchOcr';
import { runBatch, type Result } from './run';
vi.mock('./run', () => ({ runBatch: vi.fn() }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.mocked(runBatch).mockReset();
});
async function select() {
  fireEvent.change(screen.getByLabelText('Choose OCR images'), {
    target: { files: [new File(['data'], 'one.png')] }
  });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'OCR language' }));
  fireEvent.click(await screen.findByRole('option', { name: 'Vietnamese' }));
}
it('requires language and explicit Run; cancel/replacement/unmount abort and late output cannot reappear', async () => {
  let resolve!: (result: Result) => void;
  vi.mocked(runBatch).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      })
  );
  const view = render(<BatchOcr />);
  expect(screen.getByRole('button', { name: 'Run OCR' })).toBeDisabled();
  await select();
  expect(runBatch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  const signal = vi.mocked(runBatch).mock.calls[0][2];
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(signal.aborted).toBe(true);
  await act(async () =>
    resolve({ texts: ['old'], txt: new Blob(), zip: new Blob() })
  );
  expect(
    screen.queryByRole('link', { name: 'Download TXT' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  const next = vi.mocked(runBatch).mock.calls[1][2];
  fireEvent.change(screen.getByLabelText('Choose OCR images'), {
    target: { files: [new File(['new'], 'two.png')] }
  });
  expect(next.aborted).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  const last = vi.mocked(runBatch).mock.calls[2][2];
  view.unmount();
  expect(last.aborted).toBe(true);
});
it('revokes result URLs when inputs change and allows retry after failure', async () => {
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.mocked(runBatch)
    .mockRejectedValueOnce(Error('Network unavailable'))
    .mockResolvedValueOnce({ texts: [''], txt: new Blob(), zip: new Blob() });
  render(<BatchOcr />);
  await select();
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  await screen.findByText('Network unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  await screen.findByRole('link', { name: 'Download ZIP' });
  expect(screen.getByText(/No text was detected/)).toBeVisible();
  expect(create).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  await waitFor(() => expect(revoke).toHaveBeenCalledTimes(2));
  expect(
    screen.queryByRole('link', { name: 'Download ZIP' })
  ).not.toBeInTheDocument();
});
it('terminates the current run at the fixed deadline', async () => {
  render(<BatchOcr />);
  await select();
  vi.useFakeTimers();
  vi.mocked(runBatch).mockImplementation(() => new Promise(() => {}));
  fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
  const signal = vi.mocked(runBatch).mock.calls[0][2];
  await act(async () => vi.advanceTimersByTime(180_000));
  expect(signal.aborted).toBe(true);
  expect(screen.getByText(/exceeded the 180-second/)).toBeVisible();
});
