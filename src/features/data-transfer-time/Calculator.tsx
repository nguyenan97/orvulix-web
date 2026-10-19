import { useState } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  estimateTransfer,
  formatDuration,
  formatNumber,
  UNITS,
  type Field,
  type TransferInput
} from './model';
const INITIAL: TransferInput = {
  size: '',
  sizeUnit: 'GB',
  rate: '',
  rateUnit: 'Mb',
  efficiency: ''
};
const EXAMPLE: TransferInput = {
  ...INITIAL,
  size: '1',
  rate: '100',
  efficiency: '80'
};
export default function Calculator() {
  const [input, setInput] = useState<TransferInput>(INITIAL);
  const result = estimateTransfer(input);
  function update(field: keyof TransferInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
  }
  const numericField = (field: Field, label: string, helperText: string) => (
    <TextField
      label={label}
      value={input[field]}
      onChange={(event) => update(field, event.target.value)}
      inputProps={{ inputMode: 'decimal', maxLength: 32 }}
      fullWidth
      error={result.kind === 'error' && result.field === field}
      helperText={
        result.kind === 'error' && result.field === field
          ? result.message
          : helperText
      }
    />
  );
  const unitField = (field: 'sizeUnit' | 'rateUnit', label: string) => (
    <TextField
      select
      fullWidth
      label={label}
      value={input[field]}
      onChange={(event) => update(field, event.target.value)}
    >
      {UNITS.map((unit) => (
        <MenuItem key={unit.symbol} value={unit.symbol}>
          {unit.symbol}
          {field === 'rateUnit' ? '/s' : ''} ({unit.name}
          {field === 'rateUnit' ? '/second' : ''})
        </MenuItem>
      ))}
    </TextField>
  );
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Typography>
        Estimate transfer time from a data size and a constant transfer rate.
        Choose bit or byte units explicitly; this calculator does not measure
        your connection.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {numericField(
          'size',
          'Data size',
          'Zero or a positive decimal, up to 1,000,000,000,000,000.'
        )}
        {unitField('sizeUnit', 'Data size unit')}
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {numericField(
          'rate',
          'Transfer rate',
          'Positive decimal, up to 1,000,000,000,000,000.'
        )}
        {unitField('rateUnit', 'Transfer rate unit')}
      </Stack>
      {numericField(
        'efficiency',
        'Efficiency (%)',
        'Optional: blank means 100%. Use a value greater than 0 and at most 100.'
      )}
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
        <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
        <Button onClick={() => setInput(INITIAL)}>Reset calculator</Button>
      </Stack>
      {result.kind === 'incomplete' && (
        <Typography role="status">
          Enter a data size and transfer rate to estimate time.
        </Typography>
      )}
      {result.kind === 'error' && !result.field && (
        <Alert severity="error">{result.message}</Alert>
      )}
      {result.kind === 'success' && (
        <Stack
          component="section"
          aria-label="Transfer estimate"
          spacing={1}
          sx={{ overflowWrap: 'anywhere' }}
        >
          <Typography component="h2" variant="h6">
            Estimated transfer time
          </Typography>
          <Typography role="status" data-testid="transfer-duration">
            {formatDuration(result.seconds)}
          </Typography>
          <Typography data-testid="transfer-seconds">
            Approximately {formatNumber(result.seconds)} seconds
          </Typography>
          <Typography data-testid="transfer-effective-rate">
            Effective rate: approximately{' '}
            {formatNumber(result.effectiveBitsPerSecond)} bits/s
          </Typography>
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        1 byte = 8 bits. Decimal k/M/G/T prefixes use powers of 1000; binary
        Ki/Mi/Gi/Ti use powers of 1024. Mb/s is megabits per second (Mbps); MB/s
        is megabytes per second.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Time = size in bits / (rate in bits/s × efficiency / 100). Results are
        approximate; the duration rounds up to whole seconds. Positive durations
        below one second are shown explicitly. Efficiency is your estimate of
        usable bandwidth. Latency, retries and changes in bandwidth are not
        simulated. Values stay in this page without automatic saving.
      </Typography>
    </Stack>
  );
}
