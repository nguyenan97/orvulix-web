import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Calculator from './Calculator';
import { runChecksum } from './runner';
import { writeResultText } from '../text-result-clipboard/write';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { MAX_FILE_BYTES } from './model';
vi.mock('./runner', () => ({ runChecksum: vi.fn() }));
vi.mock('../text-result-clipboard/write', () => ({
  writeResultText: vi.fn().mockResolvedValue(undefined)
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function setup() {
  const toast = vi.fn();
  const view = render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: toast }}>
      <Calculator />
    </CustomSnackBarContext.Provider>
  );
  const choose = (file = new File(['abc'], 'abc.txt')) =>
    fireEvent.change(screen.getByLabelText('Choose a file (up to 64 MiB)'), {
      target: { files: [file] }
    });
  return {
    ...view,
    toast,
    choose,
    run: () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Calculate checksum' })
      ),
    output: screen.getByLabelText('File checksum'),
    copy: screen.getByRole('button', { name: 'Copy checksum' })
  };
}
describe('current file checksum UI', () => {
  it('shows only current output, compares expected values and copies exact bytes', async () => {
    vi.mocked(runChecksum).mockResolvedValue('a'.repeat(64));
    const ui = setup();
    expect(ui.copy).toBeDisabled();
    ui.choose();
    ui.run();
    await waitFor(() => expect(ui.output).toHaveValue('a'.repeat(64)));
    fireEvent.change(screen.getByLabelText('Expected checksum (optional)'), {
      target: { value: ' ' + 'A'.repeat(64) + ' ' }
    });
    expect(screen.getByText('Checksums match.')).toBeInTheDocument();
    fireEvent.click(ui.copy);
    await waitFor(() =>
      expect(writeResultText).toHaveBeenCalledWith('a'.repeat(64))
    );
    ui.choose(new File(['next'], 'next.bin'));
    expect(ui.output).toHaveValue('');
    expect(ui.copy).toBeDisabled();
    expect(screen.queryByText('Checksums match.')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Expected checksum (optional)'), {
      target: { value: 'bad' }
    });
    expect(
      screen.getByText('Enter exactly 64 hexadecimal characters.')
    ).toBeInTheDocument();
  });
  it.each(['cancel', 'clear', 'file', 'algorithm', 'unmount'])(
    'discards delayed output after %s',
    async (action) => {
      let finish!: (value: string) => void;
      vi.mocked(runChecksum).mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const ui = setup();
      ui.choose();
      ui.run();
      const signal = vi.mocked(runChecksum).mock.calls.at(-1)![2];
      if (action === 'cancel')
        fireEvent.click(
          screen.getByRole('button', { name: 'Cancel calculation' })
        );
      if (action === 'clear')
        fireEvent.click(screen.getByRole('button', { name: 'Clear file' }));
      if (action === 'file') ui.choose(new File(['next'], 'next.txt'));
      if (action === 'algorithm') {
        fireEvent.mouseDown(screen.getByLabelText('Hash algorithm'));
        fireEvent.click(screen.getByRole('option', { name: 'SHA-512' }));
      }
      if (action === 'unmount') ui.unmount();
      expect(signal.aborted).toBe(true);
      await act(async () => finish('a'.repeat(64)));
      if (action !== 'unmount') {
        expect(ui.output).toHaveValue('');
        expect(ui.copy).toBeDisabled();
      }
      expect(ui.toast).not.toHaveBeenCalled();
    }
  );
  it('rejects oversized selection without starting and supports same-file retry after failure', async () => {
    const ui = setup(),
      large = new File([], 'large.bin');
    Object.defineProperty(large, 'size', { value: MAX_FILE_BYTES + 1 });
    ui.choose(large);
    expect(
      screen.getByText('Choose a file no larger than 64 MiB.')
    ).toBeInTheDocument();
    expect(runChecksum).not.toHaveBeenCalled();
    vi.mocked(runChecksum)
      .mockRejectedValueOnce(Error('Worker failed'))
      .mockResolvedValueOnce('b'.repeat(64));
    const same = new File(['abc'], 'same.txt');
    ui.choose(same);
    ui.run();
    await screen.findByText('Worker failed');
    ui.choose(same);
    ui.run();
    await waitFor(() => expect(ui.output).toHaveValue('b'.repeat(64)));
  });
  it('suppresses delayed clipboard notices after clear and gives current failure guidance', async () => {
    vi.mocked(runChecksum).mockResolvedValue('c'.repeat(64));
    let rejectCopy!: (reason: Error) => void;
    vi.mocked(writeResultText).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectCopy = reject;
        })
    );
    const ui = setup();
    ui.choose();
    ui.run();
    await waitFor(() => expect(ui.copy).not.toBeDisabled());
    fireEvent.click(ui.copy);
    fireEvent.click(screen.getByRole('button', { name: 'Clear file' }));
    await act(async () => rejectCopy(Error('old permission failure')));
    expect(ui.toast).not.toHaveBeenCalled();
    ui.choose();
    ui.run();
    await waitFor(() => expect(ui.copy).not.toBeDisabled());
    vi.mocked(writeResultText).mockRejectedValueOnce(Error('copy manually'));
    fireEvent.click(ui.copy);
    await waitFor(() =>
      expect(ui.toast).toHaveBeenCalledWith('copy manually', 'error')
    );
  });
});
