import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
import { GifInputError } from './input-error';
export const TIMING_RANGE = {
  fps: { min: 1, max: 60 },
  delay: { min: 50, max: 10_000 }
} as const;
export function timing(options: InitialValuesType) {
  const { frameRateMode: mode, frameRateValue: value } = options;
  if (mode !== 'fps' && mode !== 'delay')
    throw new GifInputError('Choose FPS or frame delay.');
  const { min, max } = TIMING_RANGE[mode];
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new GifInputError(
      mode === 'fps'
        ? 'Enter FPS between 1 and 60.'
        : 'Enter frame delay between 50 and 10000 ms.'
    );
  return {
    delayMs: mode === 'fps' ? 1000 / value : value,
    fps: mode === 'fps' ? value : 1000 / value
  };
}
export function timingError(options: InitialValuesType) {
  try {
    timing(options);
    return '';
  } catch (error) {
    return (error as GifInputError).message;
  }
}
export function switchTiming(
  options: InitialValuesType,
  mode: InitialValuesType['frameRateMode']
) {
  if (options.frameRateMode === mode) return { options, adjusted: false };
  let requested: number;
  let reset = false;
  try {
    const current = timing(options);
    requested = mode === 'fps' ? current.fps : current.delayMs;
  } catch {
    requested = mode === 'fps' ? 10 : 100;
    reset = true;
  }
  const { min, max } = TIMING_RANGE[mode];
  const value =
    Math.round(Math.min(max, Math.max(min, requested)) * 1_000_000) / 1_000_000;
  return {
    options: { frameRateMode: mode, frameRateValue: value },
    adjusted: reset || requested < min || requested > max
  };
}
