import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToolTextInput from '../../components/input/ToolTextInput';
import ToolCodeInput from '../../components/input/ToolCodeInput';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';

// Isolate only Monaco's editor boundary; native tests load the real renderer.
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => <pre>{value}</pre>
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
const value = '{"message":"Việt Nam 😀","literal":"a\\nb"}\nnext\tline';
for (const kind of ['text', 'code'] as const) {
  describe(`${kind} input copy`, () => {
    function view(input = value) {
      const notice = vi.fn();
      const onChange = vi.fn();
      const element = (input: string) => (
        <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
          {kind === 'code' ? (
            <ToolCodeInput value={input} onChange={onChange} language="json" />
          ) : (
            <ToolTextInput value={input} onChange={onChange} />
          )}
        </CustomSnackBarContext.Provider>
      );
      const result = render(element(input));
      return {
        notice,
        onChange,
        rerender: (next: string) => result.rerender(element(next))
      };
    }
    it('guides missing API instead of throwing from a copy gesture', async () => {
      vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(
        undefined as unknown as Clipboard
      );
      const { notice } = view();
      fireEvent.click(screen.getByText('inputFooter.copyToClipboard'));
      await waitFor(() =>
        expect(notice).toHaveBeenCalledWith(
          expect.stringContaining('copy it manually'),
          'error'
        )
      );
    });
    it.each([value, '', 'literal\\n\\t <markup>'])(
      'preserves exact input bytes: %s',
      async (input) => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
          writeText
        } as unknown as Clipboard);
        const { notice, onChange } = view(input);
        expect(writeText).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('inputFooter.copyToClipboard'));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(input));
        await waitFor(() =>
          expect(notice).toHaveBeenCalledWith('toolTextInput.copied', 'success')
        );
        expect(onChange).not.toHaveBeenCalled();
      }
    );
    it.each(['denied', 'sync throw'] as const)(
      'handles %s and recovers with latest input',
      async (mode) => {
        const writeText = vi.fn();
        if (mode === 'denied')
          writeText.mockRejectedValueOnce(Error('private platform error'));
        else
          writeText.mockImplementationOnce(() => {
            throw Error('private platform error');
          });
        writeText.mockResolvedValueOnce(undefined);
        vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
          writeText
        } as unknown as Clipboard);
        const { notice, rerender } = view();
        fireEvent.click(screen.getByText('inputFooter.copyToClipboard'));
        await waitFor(() =>
          expect(notice).toHaveBeenCalledWith(
            expect.stringContaining('copy it manually'),
            'error'
          )
        );
        expect(notice.mock.calls[0][0]).not.toContain('private platform error');
        rerender('new input');
        fireEvent.click(screen.getByText('inputFooter.copyToClipboard'));
        await waitFor(() =>
          expect(notice).toHaveBeenCalledWith('toolTextInput.copied', 'success')
        );
        expect(writeText).toHaveBeenLastCalledWith('new input');
      }
    );
    if (kind === 'code')
      it.each(['click', 'keydown'] as const)(
        'isolates unsupported %s at the input footer',
        async (event) => {
          vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(
            undefined as unknown as Clipboard
          );
          const ancestor = vi.fn();
          document.body.addEventListener(event, ancestor);
          try {
            view();
            const button = screen.getByText('inputFooter.copyToClipboard');
            if (event === 'click') fireEvent.click(button);
            else fireEvent.keyDown(button, { key: 'Enter' });
            expect(ancestor).not.toHaveBeenCalled();
          } finally {
            document.body.removeEventListener(event, ancestor);
          }
        }
      );
    it('does not try a native write in an insecure context', async () => {
      vi.stubGlobal('isSecureContext', false);
      const writeText = vi.fn();
      vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
        writeText
      } as unknown as Clipboard);
      const { notice } = view();
      fireEvent.click(screen.getByText('inputFooter.copyToClipboard'));
      await waitFor(() =>
        expect(notice).toHaveBeenCalledWith(
          expect.stringContaining('Use HTTPS'),
          'error'
        )
      );
      expect(writeText).not.toHaveBeenCalled();
    });
  });
}
