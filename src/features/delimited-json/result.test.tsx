import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { afterEach, expect, it, vi } from 'vitest';
import { DelimitedResult } from './Result';
import type { DelimitedOptions } from './convert';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key })
}));
const options: DelimitedOptions = {
  delimiter: ',',
  quote: '"',
  comment: '#',
  useHeaders: true,
  skipEmptyLines: true,
  dynamicTypes: true
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('removes stale output and blocks export on invalid input or Clear, then recovers', () => {
  const view = (input: string) => (
    <Formik initialValues={options} onSubmit={() => undefined}>
      <DelimitedResult input={input} title="JSON" />
    </Formik>
  );
  const { rerender } = render(view('a,b\n1,2'));
  expect(
    JSON.parse((screen.getByTestId('text-result') as HTMLTextAreaElement).value)
  ).toEqual([{ a: 1, b: 2 }]);
  rerender(view('a,b\n1'));
  expect(screen.getByRole('alert')).toHaveTextContent('expected 2');
  expect(screen.getByTestId('text-result')).toHaveValue('');
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'resultFooter.copy' })
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'resultFooter.download' })
  );
  rerender(view('a\n"line\ntext"'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByTestId('text-result')).toHaveValue(
    '[\n  {\n    "a": "line\\ntext"\n  }\n]'
  );
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeEnabled();
  rerender(view(''));
  expect(screen.getByTestId('text-result')).toHaveValue('');
  expect(
    screen.getByRole('button', { name: 'resultFooter.copy' })
  ).toBeDisabled();
});
