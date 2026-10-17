import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { STEP_LABELS, type Step } from './model';

export default function StepEditor({
  step,
  headingId,
  index,
  count,
  onChange,
  onMove,
  onRemove
}: {
  step: Step;
  headingId: string;
  index: number;
  count: number;
  onChange: (step: Step) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        minWidth: 0
      }}
    >
      <Stack spacing={2}>
        <Typography
          id={headingId}
          tabIndex={-1}
          component="h3"
          variant="subtitle1"
          sx={{
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main'
            }
          }}
        >
          Step {index + 1}: {STEP_LABELS[step.type]}
        </Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
          <Button
            size="small"
            aria-label={`Move step ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            Move up
          </Button>
          <Button
            size="small"
            aria-label={`Move step ${index + 1} down`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            Move down
          </Button>
          <Button
            size="small"
            aria-label={`Remove step ${index + 1}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </Stack>
        {(step.type === 'base64' || step.type === 'url') && (
          <TextField
            select
            label={`Step ${index + 1} mode`}
            value={step.options.mode}
            onChange={(event) =>
              onChange({
                ...step,
                options: { mode: event.target.value as 'encode' | 'decode' }
              })
            }
          >
            <MenuItem value="encode">Encode</MenuItem>
            <MenuItem value="decode">Decode</MenuItem>
          </TextField>
        )}
        {step.type === 'deduplicate' && (
          <>
            <TextField
              select
              label={`Step ${index + 1} duplicate mode`}
              value={step.options.mode}
              onChange={(event) =>
                onChange({
                  ...step,
                  options: {
                    ...step.options,
                    mode: event.target.value as typeof step.options.mode
                  }
                })
              }
            >
              <MenuItem value="all">Remove all repeated lines</MenuItem>
              <MenuItem value="consecutive">
                Remove consecutive repeats
              </MenuItem>
              <MenuItem value="unique">Keep only unique lines</MenuItem>
            </TextField>
            <TextField
              select
              label={`Step ${index + 1} blank lines`}
              value={step.options.newlines}
              onChange={(event) =>
                onChange({
                  ...step,
                  options: {
                    ...step.options,
                    newlines: event.target.value as typeof step.options.newlines
                  }
                })
              }
            >
              <MenuItem value="filter">
                Treat blank lines as regular lines
              </MenuItem>
              <MenuItem value="preserve">Preserve all blank lines</MenuItem>
              <MenuItem value="delete">Delete blank lines first</MenuItem>
            </TextField>
            <FormControlLabel
              label={`Step ${index + 1}: Trim lines`}
              control={
                <Checkbox
                  checked={step.options.trimTextLines}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      options: {
                        ...step.options,
                        trimTextLines: event.target.checked
                      }
                    })
                  }
                />
              }
            />
            <FormControlLabel
              label={`Step ${index + 1}: Sort lines`}
              control={
                <Checkbox
                  checked={step.options.sortLines}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      options: {
                        ...step.options,
                        sortLines: event.target.checked
                      }
                    })
                  }
                />
              }
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
