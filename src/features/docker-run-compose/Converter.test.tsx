import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Converter from './Converter';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
import { writeResultText } from '../text-result-clipboard/write';
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
      <Converter />
    </CustomSnackBarContext.Provider>
  );
  const source = screen.getByTestId('text-input');
  const run = screen.getByRole('button', { name: 'Convert command' });
  const copy = screen.getByRole('button', { name: 'Copy Compose YAML' });
  return {
    ...view,
    toast,
    source,
    run,
    copy,
    output: screen.getByTestId('compose-output')
  };
}
describe('current Compose result ownership', () => {
  it('clears exports on every source/service edit, invalid conversion and Clear, with recovery', async () => {
    const ui = setup();
    expect(ui.copy).toBeDisabled();
    fireEvent.change(ui.source, { target: { value: 'docker run alpine' } });
    fireEvent.click(ui.run);
    expect(ui.output).toHaveValue(
      '"services":\n  "app":\n    "image": "alpine"\n    "network_mode": "bridge"\n'
    );
    fireEvent.click(ui.copy);
    await waitFor(() =>
      expect(writeResultText).toHaveBeenCalledWith(
        '"services":\n  "app":\n    "image": "alpine"\n    "network_mode": "bridge"\n'
      )
    );
    fireEvent.change(screen.getByLabelText('Compose service name'), {
      target: { value: 'api' }
    });
    expect(ui.output).toHaveValue('');
    expect(ui.copy).toBeDisabled();
    fireEvent.click(ui.run);
    expect(ui.output).toHaveValue(
      '"services":\n  "api":\n    "image": "alpine"\n    "network_mode": "bridge"\n'
    );
    fireEvent.change(ui.source, {
      target: { value: 'docker run --privileged alpine' }
    });
    fireEvent.click(ui.run);
    expect(screen.getByText(/Unsupported Docker option/)).toBeVisible();
    expect(ui.copy).toBeDisabled();
    expect(ui.output).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    fireEvent.click(ui.run);
    expect(ui.copy).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear command' }));
    expect(ui.copy).toBeDisabled();
    expect(ui.output).toHaveValue('');
    expect(ui.run).toBeDisabled();
  });
  it('does not publish stale clipboard notifications after edits or unmount', async () => {
    let resolve!: () => void;
    vi.mocked(writeResultText).mockReturnValueOnce(
      new Promise<void>((done) => {
        resolve = done;
      })
    );
    const ui = setup();
    fireEvent.change(ui.source, { target: { value: 'docker run alpine' } });
    fireEvent.click(ui.run);
    fireEvent.click(ui.copy);
    fireEvent.change(ui.source, { target: { value: 'docker run nginx' } });
    await act(async () => resolve());
    expect(ui.toast).not.toHaveBeenCalled();
    let reject!: (error: Error) => void;
    vi.mocked(writeResultText).mockReturnValueOnce(
      new Promise<void>((_, fail) => {
        reject = fail;
      })
    );
    fireEvent.click(ui.run);
    fireEvent.click(ui.copy);
    ui.unmount();
    await act(async () => reject(Error('denied')));
    expect(ui.toast).not.toHaveBeenCalled();
  });
  it('admits the exact source cap and prevents over-budget conversion, then recovers', () => {
    const ui = setup();
    fireEvent.change(ui.source, {
      target: { value: 'docker run alpine'.padEnd(32768, ' ') }
    });
    fireEvent.click(ui.run);
    expect(ui.copy).toBeEnabled();
    fireEvent.change(ui.source, { target: { value: 'x'.repeat(32769) } });
    expect(ui.run).toBeDisabled();
    expect(ui.copy).toBeDisabled();
    expect(screen.getByText(/Command exceeds 32,768/)).toBeVisible();
    fireEvent.change(ui.source, { target: { value: 'docker run alpine' } });
    fireEvent.click(ui.run);
    expect(ui.copy).toBeEnabled();
  });
});
