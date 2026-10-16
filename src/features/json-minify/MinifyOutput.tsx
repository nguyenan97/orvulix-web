import { Alert, Box } from '@mui/material';
import ToolCodeResult from '../../components/result/ToolCodeResult';
import type { MinifyOutcome } from './result';

export function MinifyOutput({
  outcome,
  title
}: {
  outcome: MinifyOutcome;
  title: string;
}) {
  return (
    <Box>
      {'message' in outcome && (
        <Alert
          severity="error"
          aria-label="JSON minification error"
          sx={{ mb: 1 }}
        >
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
