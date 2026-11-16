import { MenuItem, TextField } from '@mui/material';
import { CONVERSION_PRESETS } from './presets';
export default function PresetFields({
  output,
  onApply
}: {
  output: 'image' | 'pdf';
  onApply: (id: string) => void;
}) {
  return (
    <TextField
      select
      fullWidth
      label="Conversion preset"
      value=""
      onChange={(event) => onApply(event.target.value)}
      helperText="Apply options only. Keeps your HTML and filename; clears old preview/download. No automatic conversion or saved settings."
    >
      <MenuItem value="">Choose a preset</MenuItem>
      {CONVERSION_PRESETS.filter((p) => p.output === output).map((p) => (
        <MenuItem value={p.id} key={p.id}>
          {p.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
