import { Alert, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import ToolCodeResult from '../../components/result/ToolCodeResult';
import type { InitialValuesType } from '../../pages/tools/json/prettify/types';
import { evaluatePrettify } from './result';

/** ToolContent still owns the option form; this child owns synchronous output. */
export function PrettifyResult({
  input,
  title
}: {
  input: string;
  title: string;
}) {
  const { values } = useFormikContext<InitialValuesType>();
  const result = useMemo(
    () =>
      evaluatePrettify(input, {
        indentationType: values.indentationType,
        spacesCount: values.spacesCount
      }),
    [input, values.indentationType, values.spacesCount]
  );
  return (
    <Box>
      {'message' in result && (
        <Alert
          severity="error"
          aria-label="JSON formatting error"
          sx={{ mb: 1 }}
        >
          {result.message}
        </Alert>
      )}
      <ToolCodeResult
        title={title}
        value={result.value}
        language="json"
        disabled={result.status !== 'valid'}
      />
    </Box>
  );
}

// Bypass only this tool's legacy effect: output/errors derive during render above.
export function resultIsDerived() {
  /* No result state or queued snackbar to update. */
}
