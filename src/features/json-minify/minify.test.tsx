import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MinifyJson from '../../pages/tools/json/minify';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    options,
    language
  }: {
    language?: string;
    value: string;
    onChange?: (value: string) => void;
    options?: { readOnly?: boolean };
  }) => (
    <textarea
      data-testid={options?.readOnly ? 'code-result' : 'code-input'}
      data-language={language}
      readOnly={options?.readOnly}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
}));
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (s: string) => s })
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function view() {
  const notice = vi.fn();
  render(
    <CustomSnackBarContext.Provider value={{ showSnackBar: notice }}>
      <MinifyJson title="Minify JSON" />
    </CustomSnackBarContext.Provider>
  );
  return {
    notice,
    edit: (value: string) =>
      fireEvent.change(screen.getByTestId('code-input'), { target: { value } })
  };
}
const source = '{"message":"Việt Nam 😀","literal":"a\\nb"}';
const formatted = source;
describe('JSON Minify current result ownership', () => {
  it('clears a valid result and disables copy/download when source is cleared', () => {
    const v = view();
    v.edit(source);
    expect(screen.getByTestId('code-result')).toHaveValue(formatted);
    v.edit('');
    expect(screen.getByTestId('code-result')).toHaveValue('');
    expect(
      screen.getByText('resultFooter.download').closest('button')
    ).toBeDisabled();
    expect(
      screen.getByText('resultFooter.copy').closest('button')
    ).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('replaces stale output with a current inline error and recovers without stale notices', () => {
    const v = view();
    v.edit(source);
    v.edit('{invalid');
    expect(screen.getByTestId('code-result')).toHaveValue('');
    expect(
      screen.getByRole('alert', { name: 'JSON minification error' })
    ).toHaveTextContent('Invalid JSON or JSON Lines input.');
    expect(
      screen.getByText('resultFooter.download').closest('button')
    ).toBeDisabled();
    expect(v.notice).not.toHaveBeenCalled();
    v.edit('{"next":true}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('code-result')).toHaveValue('{"next":true}');
    expect(
      screen.getByText('resultFooter.download').closest('button')
    ).toBeEnabled();
  });
  it('changes JSONL/JSON language with the current valid result and clears stale format on error', () => {
    const v = view();
    v.edit('{"a":1}\n {"b":2}');
    expect(screen.getByTestId('code-result')).toHaveValue('{"a":1}\n{"b":2}');
    expect(screen.getByTestId('code-result')).toHaveAttribute(
      'data-language',
      'jsonl'
    );
    v.edit('{oops');
    expect(screen.getByTestId('code-result')).toHaveAttribute(
      'data-language',
      'json'
    );
    v.edit('false');
    expect(screen.getByTestId('code-result')).toHaveValue('false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('code-input')).toHaveAttribute(
      'data-language',
      'json'
    );
  });
  it('never copies error text or allocates a download and copies only valid recovery bytes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    const allocate = vi.spyOn(URL, 'createObjectURL');
    const v = view();
    for (const source of ['{broken', ' ', '']) {
      v.edit(source);
      fireEvent.click(screen.getByText('resultFooter.copy'));
      fireEvent.click(screen.getByText('resultFooter.download'));
    }
    expect(writeText).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
    v.edit('{"a":1}\nfalse');
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledExactlyOnceWith('{"a":1}\nfalse')
    );
  });
});
