import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SortJson from '../../pages/tools/json/sort';
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
      <SortJson title="Sort JSON" />
    </CustomSnackBarContext.Provider>
  );
  return {
    notice,
    edit: (value: string) =>
      fireEvent.change(screen.getByTestId('code-input'), { target: { value } })
  };
}
const copy = () => screen.getByText('resultFooter.copy').closest('button');
const download = () =>
  screen.getByText('resultFooter.download').closest('button');

describe('JSON Sort current output', () => {
  it('disables export initially and clears valid output when input is cleared', () => {
    const v = view();
    expect(download()).toBeDisabled();
    expect(copy()).toBeDisabled();
    v.edit('[{"k":2},{"k":1}]');
    expect(screen.getByTestId('code-result')).toHaveValue(
      '[\n  {\n    "k": 2\n  },\n  {\n    "k": 1\n  }\n]'
    );
    v.edit('');
    expect(screen.getByTestId('code-result')).toHaveValue('');
    expect(copy()).toBeDisabled();
    expect(download()).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('never exports errors and recovers from invalid syntax and unsupported shapes', () => {
    const v = view();
    const writeText = vi.fn();
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText
    } as unknown as Clipboard);
    const allocate = vi.spyOn(URL, 'createObjectURL');
    for (const input of ['{secret', '{}', 'null', '[]', ' ']) {
      v.edit(input);
      expect(screen.getByTestId('code-result')).toHaveValue('');
      expect(
        screen.getByRole('alert', { name: 'JSON sorting error' })
      ).toBeVisible();
      expect(copy()).toBeDisabled();
      expect(download()).toBeDisabled();
      fireEvent.click(copy()!);
      fireEvent.click(download()!);
    }
    expect(writeText).not.toHaveBeenCalled();
    expect(allocate).not.toHaveBeenCalled();
    expect(v.notice).not.toHaveBeenCalled();
    v.edit('[{"k":1}]');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(download()).toBeEnabled();
  });
});
