import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrettifyJson from '../../pages/tools/json/prettify';
import { CustomSnackBarContext } from '../../contexts/CustomSnackBarContext';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    options
  }: {
    value: string;
    onChange?: (value: string) => void;
    options?: { readOnly?: boolean };
  }) => (
    <textarea
      data-testid={options?.readOnly ? 'code-result' : 'code-input'}
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
      <PrettifyJson title="Prettify JSON" />
    </CustomSnackBarContext.Provider>
  );
  return {
    notice,
    edit: (value: string) =>
      fireEvent.change(screen.getByTestId('code-input'), { target: { value } })
  };
}
const source = '{"message":"Việt Nam 😀","literal":"a\\nb"}';
const formatted = '{\n  "message": "Việt Nam 😀",\n  "literal": "a\\nb"\n}';
describe('JSON Prettify current result ownership', () => {
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
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON string');
    expect(
      screen.getByText('resultFooter.download').closest('button')
    ).toBeDisabled();
    expect(v.notice).not.toHaveBeenCalled();
    v.edit('{"next":true}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('code-result')).toHaveValue(
      '{\n  "next": true\n}'
    );
    expect(
      screen.getByText('resultFooter.download').closest('button')
    ).toBeEnabled();
  });
  it('updates options against the current source and keeps invalid output unavailable', async () => {
    const v = view();
    v.edit('{"a":[1]}');
    fireEvent.click(screen.getAllByText('prettify.useTabs')[0]);
    await waitFor(() =>
      expect(screen.getByTestId('code-result')).toHaveValue(
        '{\n\t"a": [\n\t\t1\n\t]\n}'
      )
    );
    v.edit('{oops');
    fireEvent.click(screen.getAllByText('prettify.useSpaces')[0]);
    await waitFor(() => expect(screen.getAllByRole('radio')[0]).toBeChecked());
    expect(screen.getByTestId('code-result')).toHaveValue('');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    v.edit('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    v.edit('{"a":2}');
    expect(screen.getByTestId('code-result')).toHaveValue('{\n  "a": 2\n}');
  });
  it('does not copy or allocate a download for unavailable output, then copies current recovery text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    const allocate = vi.spyOn(URL, 'createObjectURL');
    const v = view();
    v.edit(source);
    v.edit('{broken');
    fireEvent.click(screen.getByText('resultFooter.copy'));
    fireEvent.click(screen.getByText('resultFooter.download'));
    expect(writeText).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
    v.edit('{"new":false}');
    fireEvent.click(screen.getByText('resultFooter.copy'));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledExactlyOnceWith('{\n  "new": false\n}')
    );
  });
});
