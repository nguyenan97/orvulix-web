import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CompressPng from '../../pages/tools/image/png/compress-png';
import { compressPng } from './compress';
vi.mock('./compress', () => ({ compressPng: vi.fn() }));
vi.mock('../../components/input/ToolImageInput', () => ({
  default: ({ onChange }: { onChange: (file: File | null) => void }) => (
    <>
      <button
        onClick={() =>
          onChange(new File(['input'], 'first.png', { type: 'image/png' }))
        }
      >
        Choose first
      </button>
      <button
        onClick={() =>
          onChange(new File(['input'], 'second.png', { type: 'image/png' }))
        }
      >
        Choose second
      </button>
      <button onClick={() => onChange(null)}>Clear input</button>
    </>
  )
}));
beforeEach(() =>
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:test');
      static revokeObjectURL = vi.fn();
    }
  )
);
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
it('aborts superseded input and only displays the latest asynchronous output', async () => {
  const finishes: ((file: File) => void)[] = [];
  vi.mocked(compressPng).mockImplementation(
    () => new Promise((resolve) => finishes.push(resolve))
  );
  render(<CompressPng title="Compress PNG" />);
  fireEvent.click(screen.getByText('Choose first'));
  await waitFor(() => expect(finishes).toHaveLength(1));
  fireEvent.click(screen.getByText('Choose second'));
  await waitFor(() => expect(finishes).toHaveLength(2));
  expect(vi.mocked(compressPng).mock.calls[0][2].aborted).toBe(true);
  await act(async () =>
    finishes[0](new File(['old'], 'old.png', { type: 'image/png' }))
  );
  expect(screen.queryByText(/Compressed Size:/)).toBeNull();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  await act(async () =>
    finishes[1](new File(['new'], 'new.png', { type: 'image/png' }))
  );
  expect(screen.getByText(/Compressed Size:/)).toBeInTheDocument();
  expect(URL.createObjectURL).toHaveBeenCalledOnce();
});
it('clears a pending run and ignores late output after unmount', async () => {
  let finish!: (file: File) => void;
  vi.mocked(compressPng).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const { unmount } = render(<CompressPng title="Compress PNG" />);
  fireEvent.click(screen.getByText('Choose first'));
  await waitFor(() => expect(finish).toBeDefined());
  const signal = vi.mocked(compressPng).mock.calls[0][2];
  fireEvent.click(screen.getByText('Clear input'));
  expect(signal.aborted).toBe(true);
  fireEvent.click(screen.getByText('Choose second'));
  await waitFor(() => expect(compressPng).toHaveBeenCalledTimes(2));
  const unmountSignal = vi.mocked(compressPng).mock.calls[1][2];
  unmount();
  expect(unmountSignal.aborted).toBe(true);
  await act(async () =>
    finish(new File(['late'], 'late.png', { type: 'image/png' }))
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it('shows a failure without retaining output and recovers on the next input', async () => {
  vi.mocked(compressPng).mockRejectedValueOnce(
    Error('PNG has a truncated chunk.')
  );
  vi.mocked(compressPng).mockResolvedValueOnce(
    new File(['ok'], 'ok.png', { type: 'image/png' })
  );
  render(<CompressPng title="Compress PNG" />);
  fireEvent.click(screen.getByText('Choose first'));
  await screen.findByText('PNG has a truncated chunk.');
  expect(screen.queryByText(/Compressed Size:/)).toBeNull();
  fireEvent.click(screen.getByText('Choose second'));
  await screen.findByText(/Compressed Size:/);
  expect(screen.queryByText('PNG has a truncated chunk.')).toBeNull();
});
