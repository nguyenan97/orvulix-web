import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ToolCodeResult from '../../components/result/ToolCodeResult';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';
// Editor boundary only; native browser flows use real Monaco.
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => (
    <pre data-testid="code-value">{value}</pre>
  )
}));
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, options?: { error?: unknown }) =>
      options?.error ? `${key}: ${String(options.error)}` : key
  })
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('reports missing Clipboard API instead of throwing through the copy event', async () => {
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(
    undefined as unknown as Clipboard
  );
  const notice = vi.fn();
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
      <ToolCodeResult value={'{\n  "a": 1\n}'} language="json" />
    </CustomSnackBarContext.Provider>
  );
  fireEvent.click(screen.getByText('resultFooter.copy'));
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith(
      expect.stringContaining('copy it manually'),
      'error'
    )
  );
});
const formatted = '{\n  "message": "Việt Nam 😀",\n  "literal": "a\\nb"\n}';
function view(value = formatted) {
  const notice = vi.fn();
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
      <ToolCodeResult value={value} language="json" />
    </CustomSnackBarContext.Provider>
  );
  return notice;
}
it.each([formatted, '{\n\t"a": 1\n}', '', 'plain <code> \\n'])(
  'copies the exact code value without decoding escapes: %s',
  async (value) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    const notice = view(value);
    expect(screen.getByTestId('code-value').textContent).toBe(value);
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(value));
    await waitFor(() =>
      expect(notice).toHaveBeenCalledWith('toolTextResult.copied', 'success')
    );
    if (value === formatted)
      expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
        message: 'Việt Nam 😀',
        literal: 'a\nb'
      });
  }
);
it.each(['denied', 'sync throw'] as const)(
  'reports %s then permits a later native copy attempt',
  async (mode) => {
    const writeText = vi.fn();
    if (mode === 'denied')
      writeText.mockRejectedValueOnce(Error('private platform detail'));
    else
      writeText.mockImplementationOnce(() => {
        throw Error('private platform detail');
      });
    writeText.mockResolvedValueOnce(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    const notice = view();
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() =>
      expect(notice).toHaveBeenCalledWith(
        expect.stringContaining('copy it manually'),
        'error'
      )
    );
    expect(notice.mock.calls[0][0]).not.toContain('private platform detail');
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() =>
      expect(notice).toHaveBeenCalledWith('toolTextResult.copied', 'success')
    );
    expect(writeText).toHaveBeenLastCalledWith(formatted);
  }
);
it('does not attempt native clipboard writes on an insecure origin', async () => {
  vi.stubGlobal('isSecureContext', false);
  const writeText = vi.fn();
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
    writeText
  } as unknown as Clipboard);
  const notice = view();
  fireEvent.click(screen.getByText('resultFooter.copy'));
  await waitFor(() =>
    expect(notice).toHaveBeenCalledWith(
      expect.stringContaining('Use HTTPS'),
      'error'
    )
  );
  expect(writeText).not.toHaveBeenCalled();
});
it.each(['click', 'keydown'] as const)(
  'isolates unsupported %s from Monaco ancestor clipboard handlers',
  async (kind) => {
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(
      undefined as unknown as Clipboard
    );
    const ancestor = vi.fn();
    document.body.addEventListener(kind, ancestor);
    try {
      view();
      const button = screen.getByText('resultFooter.copy');
      if (kind === 'click') fireEvent.click(button);
      else fireEvent.keyDown(button, { key: 'Enter' });
      expect(ancestor).not.toHaveBeenCalled();
    } finally {
      document.body.removeEventListener(kind, ancestor);
    }
  }
);
it.each(['click', 'keydown'] as const)(
  'preserves supported %s propagation and the native action',
  async (kind) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText,
      write: vi.fn()
    } as unknown as Clipboard);
    const ancestor = vi.fn();
    document.body.addEventListener(kind, ancestor);
    try {
      view();
      const button = screen.getByText('resultFooter.copy');
      if (kind === 'click') fireEvent.click(button);
      else fireEvent.keyDown(button, { key: 'Enter' });
      expect(ancestor).toHaveBeenCalledTimes(1);
      if (kind === 'click')
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(formatted));
    } finally {
      document.body.removeEventListener(kind, ancestor);
    }
  }
);
