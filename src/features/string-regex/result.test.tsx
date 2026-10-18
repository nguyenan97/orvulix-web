import { act, cleanup, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { afterEach, expect, it, vi } from 'vitest';
import { StringResult } from './Result';
import { runString } from './runner';
import { initialValues } from '../../pages/tools/string/text-replacer/initialValues';
vi.mock('./runner', () => ({ runString: vi.fn() }));
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key })
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('hides obsolete output/errors, aborts changed input and unmount, and recovers', async () => {
  const jobs: {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    signal: AbortSignal;
  }[] = [];
  vi.mocked(runString).mockImplementation(
    (_request, signal) =>
      new Promise((resolve, reject) => jobs.push({ resolve, reject, signal }))
  );
  const view = (input: string) => (
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      <StringResult tool="replace" input={input} title="Output" />
    </Formik>
  );
  const { rerender, unmount } = render(view('first'));
  rerender(view('second'));
  expect(jobs[0].signal.aborted).toBe(true);
  await act(async () => {
    jobs[0].resolve('stale');
  });
  expect(screen.queryByTestId('text-result')).not.toBeInTheDocument();
  await act(async () => {
    jobs[1].reject(new Error('Invalid pattern'));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid pattern');
  expect(screen.getByTestId('text-result')).toHaveValue('');
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  rerender(view('valid'));
  await act(async () => {
    jobs[2].resolve('current');
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByTestId('text-result')).toHaveValue('current');
  rerender(view(''));
  expect(screen.getByTestId('text-result')).toHaveValue('');
  expect(
    screen.getByRole('button', { name: 'resultFooter.download' })
  ).toBeDisabled();
  rerender(view('last'));
  unmount();
  expect(jobs[3].signal.aborted).toBe(true);
  await act(async () => {
    jobs[3].reject(new Error('late unmounted failure'));
  });
});
