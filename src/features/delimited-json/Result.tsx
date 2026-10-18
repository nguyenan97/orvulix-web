import { Alert, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import ToolTextResult from '../../components/result/ToolTextResult';
import { convertDelimited, type DelimitedOptions } from './convert';

export function DelimitedResult({
  input,
  title
}: {
  input: string;
  title: string;
}) {
  const { values } = useFormikContext<DelimitedOptions>();
  const result = useMemo(() => {
    if (!input) return { value: '', error: '' };
    try {
      return { value: convertDelimited(input, values), error: '' };
    } catch (error) {
      return {
        value: '',
        error:
          error instanceof Error ? error.message : 'Invalid delimited input.'
      };
    }
  }, [input, values]);
  return (
    <Box>
      {result.error && (
        <Alert
          severity="error"
          aria-label="Delimited input error"
          sx={{ mb: 1 }}
        >
          {result.error}
        </Alert>
      )}
      <ToolTextResult
        title={title}
        value={result.value}
        extension="json"
        keepSpecialCharacters
        disabled={!input || Boolean(result.error)}
      />
    </Box>
  );
}

export function resultIsDerived() {
  // The current form values and input own output validity, without queued effects.
}
