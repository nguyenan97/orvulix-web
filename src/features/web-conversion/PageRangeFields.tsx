import { MenuItem, Stack, TextField } from '@mui/material';
import { RANGE_LIMITS, type PageSelection } from './page-ranges';
export default function PageRangeFields({
  value,
  onChange
}: {
  value: PageSelection;
  onChange: (value: PageSelection) => void;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Pages to export"
        select
        fullWidth
        value={value.mode}
        onChange={(e) =>
          onChange(
            e.target.value === 'all'
              ? { mode: 'all' }
              : { mode: 'custom', expression: '' }
          )
        }
      >
        <MenuItem value="all">All pages</MenuItem>
        <MenuItem value="custom">Custom ranges</MenuItem>
      </TextField>
      {value.mode === 'custom' && (
        <TextField
          label="Page ranges"
          fullWidth
          value={value.expression}
          onChange={(e) =>
            onChange({ mode: 'custom', expression: e.target.value })
          }
          placeholder="1,3,5-7"
          inputProps={{ maxLength: RANGE_LIMITS.inputBytes + 1 }}
          helperText="1-based source pages. Duplicates/overlaps are normalized in document order. Up to 128 UTF-8 bytes and 16 tokens. Preview/Convert validates against the full document."
        />
      )}
    </Stack>
  );
}
