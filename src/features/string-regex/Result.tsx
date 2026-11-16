import { Alert, Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import ToolTextResult from '../../components/result/ToolTextResult';
import type { StringRequest } from './model';
import { runString } from './runner';

export function StringResult({
  tool,
  input,
  title
}: {
  tool: StringRequest['tool'];
  input: string;
  title: string;
}) {
  const { values } = useFormikContext<StringRequest['options']>();
  const [state, setState] = useState<{
    input: string;
    options: typeof values | null;
    value: string;
    loading: boolean;
    error: string;
  }>({ input: '', options: null, value: '', loading: false, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setState({
      input,
      options: values,
      value: '',
      loading: Boolean(input),
      error: ''
    });
    if (input) {
      const request = { tool, input, options: values } as StringRequest;
      runString(request, controller.signal).then(
        (value) => {
          if (current)
            setState({
              input,
              options: values,
              value,
              loading: false,
              error: ''
            });
        },
        (error: unknown) => {
          if (current)
            setState({
              input,
              options: values,
              value: '',
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'String processing failed.'
            });
        }
      );
    }
    return () => {
      current = false;
      controller.abort();
    };
  }, [tool, input, values]);
  const current = state.input === input && state.options === values;
  const loading = input !== '' && (!current || state.loading);
  const error = current ? state.error : '';
  return (
    <Box>
      {error && (
        <Alert severity="error" aria-label="String processing error">
          {error}
        </Alert>
      )}
      <ToolTextResult
        title={title}
        value={current ? state.value : ''}
        loading={loading}
        disabled={!input || loading || Boolean(error)}
      />
      <Typography variant="caption">
        Limits: 64 Ki UTF-16 input units, 1024-unit pattern/options, 4096-unit
        replacement, 20000 potential parts, 1 Mi output units. Regex processing
        has a 2 second deadline. Large potential expansions may be rejected
        before processing.
      </Typography>
    </Box>
  );
}

export function resultIsOwned() {
  // This result component owns the disposable job, not ToolContent's callback.
}
