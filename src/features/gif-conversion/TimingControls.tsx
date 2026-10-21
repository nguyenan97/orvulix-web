import { useState } from 'react';
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
import { switchTiming, timing, timingError, TIMING_RANGE } from './timing';
export function TimingControls({
  values,
  onChange
}: {
  values: InitialValuesType;
  onChange: (options: InitialValuesType) => void;
}) {
  const { t } = useTranslation('video');
  const [adjusted, setAdjusted] = useState(false);
  const mode = values.frameRateMode;
  const error = timingError(values);
  const resolved = error ? undefined : timing(values);
  const format = (value: number) => Number(value.toFixed(3)).toString();
  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel id="gif-timing-mode">
          {t('gif.imagesToGif.timingMode')}
        </FormLabel>
        <RadioGroup
          aria-labelledby="gif-timing-mode"
          value={mode}
          onChange={(event) => {
            const next = event.target.value;
            if ((next !== 'fps' && next !== 'delay') || next === mode) return;
            const result = switchTiming(values, next);
            setAdjusted(result.adjusted);
            onChange(result.options);
          }}
        >
          <FormControlLabel
            value="fps"
            control={<Radio />}
            label={t('gif.imagesToGif.frameRate')}
          />
          <FormControlLabel
            value="delay"
            control={<Radio />}
            label={t('gif.imagesToGif.frameDelay')}
          />
        </RadioGroup>
      </FormControl>
      <TextField
        type="number"
        label={t(
          mode === 'fps'
            ? 'gif.imagesToGif.fpsValueLabel'
            : 'gif.imagesToGif.delayValueLabel'
        )}
        value={values.frameRateValue}
        inputProps={{ ...TIMING_RANGE[mode], step: 'any' }}
        error={!!error}
        helperText={
          error ||
          t(
            mode === 'fps'
              ? 'gif.imagesToGif.fpsRangeHint'
              : 'gif.imagesToGif.delayRangeHint'
          )
        }
        onChange={(event) => {
          setAdjusted(false);
          onChange({
            ...values,
            frameRateValue:
              event.target.value === '' ? '' : Number(event.target.value)
          });
        }}
      />
      {adjusted && (
        <Alert severity="info" role="status">
          {t('gif.imagesToGif.timingAdjusted')}
        </Alert>
      )}
      {resolved && (
        <Typography aria-live="polite">
          {t('gif.imagesToGif.timingSummary', {
            delay: format(resolved.delayMs),
            fps: format(resolved.fps)
          })}
        </Typography>
      )}
      <Typography variant="body2">
        {t('gif.imagesToGif.timingPrecision')}
      </Typography>
    </Stack>
  );
}
