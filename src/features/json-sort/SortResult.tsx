import { Alert, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import ToolCodeResult from '../../components/result/ToolCodeResult';
import type { InitialValuesType } from '../../pages/tools/json/sort/types';
import { evaluateSort } from './result';

export function SortResult({ input, title }: { input: string; title: string }) {
  const { values } = useFormikContext<InitialValuesType>();
  const { mode, key, order } = values;
  const outcome = useMemo(
    () => evaluateSort(input, { mode, key, order }),
    [input, mode, key, order]
  );
  return (
    <Box>
      {'message' in outcome && (
        <Alert severity="error" aria-label="JSON sorting error" sx={{ mb: 1 }}>
          {outcome.message}
        </Alert>
      )}
      <ToolCodeResult
        title={title}
        value={outcome.value}
        language={outcome.format}
        disabled={outcome.status !== 'valid'}
      />
    </Box>
  );
}

export function resultIsDerived() {
  /* Current input/options derive output in the Formik child, without queued effects. */
}
