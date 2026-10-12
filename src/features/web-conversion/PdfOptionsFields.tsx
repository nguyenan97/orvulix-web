import { MenuItem, Stack, TextField } from '@mui/material';
import type { PdfOptions } from './pdf-model';
export default function PdfOptionsFields({
  value,
  onChange
}: {
  value: PdfOptions;
  onChange: (next: PdfOptions) => void;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Paper size"
        select
        value={value.paper}
        onChange={(event) =>
          onChange({
            ...value,
            paper: event.target.value as PdfOptions['paper']
          })
        }
        fullWidth
      >
        <MenuItem value="a4">A4 (210 x 297 mm)</MenuItem>
        <MenuItem value="letter">Letter (215.9 x 279.4 mm)</MenuItem>
      </TextField>
      <TextField
        label="Page orientation"
        select
        value={value.orientation}
        onChange={(event) =>
          onChange({
            ...value,
            orientation: event.target.value as PdfOptions['orientation']
          })
        }
        fullWidth
      >
        <MenuItem value="portrait">Portrait</MenuItem>
        <MenuItem value="landscape">Landscape</MenuItem>
      </TextField>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <TextField
            key={side}
            label={`${
              side.charAt(0).toUpperCase() + side.slice(1)
            } margin (mm)`}
            type="number"
            value={value.margins[side]}
            onChange={(event) =>
              onChange({
                ...value,
                margins: {
                  ...value.margins,
                  [side]: Number(event.target.value)
                }
              })
            }
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            sx={{ flex: 1, minWidth: 120 }}
          />
        ))}
      </Stack>
    </Stack>
  );
}
