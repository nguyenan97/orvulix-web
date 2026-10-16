import { beautifyJson } from '../../pages/tools/json/prettify/service';
import type { InitialValuesType } from '../../pages/tools/json/prettify/types';

export type PrettifyResult =
  | { status: 'empty'; value: '' }
  | { status: 'invalid'; value: ''; message: string }
  | { status: 'valid'; value: string };

/** Preserve the existing formatter; own only the current input/options outcome. */
export function evaluatePrettify(
  input: string,
  options: InitialValuesType
): PrettifyResult {
  if (input === '') return { status: 'empty', value: '' };
  try {
    return { status: 'valid', value: beautifyJson(input, options) };
  } catch {
    return { status: 'invalid', value: '', message: 'Invalid JSON string' };
  }
}
