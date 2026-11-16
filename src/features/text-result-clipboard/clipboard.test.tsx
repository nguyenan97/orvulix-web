import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ToolTextResult from '../../components/result/ToolTextResult';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, options?: { error?: unknown }) =>
      options?.error ? `${key}: ${String(options.error)}` : key
  })
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('copies the displayed transformed output, not its escaped source representation', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
    writeText
  } as unknown as Clipboard);
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: vi.fn() }}>
      <ToolTextResult value={'first\\nsecond\\tViệt Nam'} />
    </CustomSnackBarContext.Provider>
  );
  expect(screen.getByTestId('text-result')).toHaveValue(
    'first\nsecond\tViệt Nam'
  );
  fireEvent.click(screen.getByText('resultFooter.copy'));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith('first\nsecond\tViệt Nam')
  );
});
it.each([
  { value: 'a\\nb', keep: true, shown: 'a\\nb' },
  { value: 'a\\rb\\r\\nc', keep: false, shown: 'a\nb\nc' },
  { value: 'a\r\nb\rc', keep: true, shown: 'a\nb\nc' },
  { value: 'Việt Nam 😀\\tend', keep: false, shown: 'Việt Nam 😀\tend' },
  { value: '', keep: false, shown: '' }
])(
  'copies literal DOM text for $value / keep=$keep',
  async ({ value, keep, shown }) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const notice = vi.fn();
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    render(
      <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
        <ToolTextResult value={value} keepSpecialCharacters={keep} />
      </CustomSnackBarContext.Provider>
    );
    expect(screen.getByTestId('text-result')).toHaveValue(shown);
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(shown));
    await waitFor(() =>
      expect(notice).toHaveBeenCalledWith('toolTextResult.copied', 'success')
    );
  }
);
it.each(['missing', 'denied', 'sync throw'] as const)(
  'handles %s clipboard access without an uncaught exception',
  async (mode) => {
    const writeText = vi.fn(() => {
      if (mode === 'sync throw') throw Error('private detail');
      return Promise.reject(Error('private detail'));
    });
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(
      mode === 'missing'
        ? (undefined as unknown as Clipboard)
        : ({ writeText } as unknown as Clipboard)
    );
    const notice = vi.fn();
    render(
      <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
        <ToolTextResult value="safe" />
      </CustomSnackBarContext.Provider>
    );
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() =>
      expect(notice).toHaveBeenCalledWith(
        expect.stringContaining('copy it manually'),
        'error'
      )
    );
    expect(notice.mock.calls[0][0]).not.toContain('private detail');
  }
);
