import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import type { FormikValues } from 'formik';
import ToolContent from '../../components/ToolContent';
import type { ListOperation } from './model';
import { runList } from './runner';
import { createRequest } from './request';

type Props<T extends FormikValues> = ComponentProps<
  typeof ToolContent<T, string>
> & {
  workerOperation: ListOperation;
  setResult: (value: string) => void;
};
/** Small adapter: existing symbol compute stays synchronous; regex is isolated. */
export default function BoundedListContent<T extends FormikValues>({
  workerOperation,
  setResult,
  compute,
  resultComponent,
  ...props
}: Props<T>) {
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
    },
    []
  );
  const boundedCompute = (values: T, input: string) => {
    request.current?.abort();
    request.current = null;
    setResult('');
    setError('');
    setBusy(false);
    if (!input) return;
    if ((values.splitOperatorType ?? values.splitSeparatorType) !== 'regex') {
      compute(values, input);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    // Convert/validate the contract before starting a worker. Do not let parser
    // errors escape Formik's sync catch while leaving the UI busy.
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted)
          throw new Error('List processing cancelled.');
        return runList(
          createRequest(workerOperation, values, input),
          controller.signal
        );
      })
      .then((result) => {
        if (request.current === controller) setResult(result);
      })
      .catch((reason: unknown) => {
        if (request.current === controller)
          setError(
            reason instanceof Error ? reason.message : 'List processing failed.'
          );
      })
      .finally(() => {
        if (request.current === controller) {
          request.current = null;
          setBusy(false);
        }
      });
  };
  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setResult('');
    setError('List processing cancelled.');
  };
  return (
    <ToolContent
      {...props}
      compute={boundedCompute}
      resultComponent={
        <Stack spacing={1}>
          {busy && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography role="status">
                Processing list in a local worker...
              </Typography>
              <Button onClick={cancel}>Cancel processing</Button>
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {resultComponent}
        </Stack>
      }
    />
  );
}
