import { beautifyJson } from '../../pages/tools/json/prettify/service';
import type { InitialValuesType } from '../../pages/tools/json/prettify/types';
import {
  checkJsonInput,
  checkJsonOutput,
  JsonBudgetError
} from '../json-resources/budget';

export type PrettifyResult =
  | { status: 'empty'; value: '' }
  | { status: 'invalid' | 'unavailable'; value: ''; message: string }
  | { status: 'valid'; value: string };

/** Preserve the existing formatter; own only the current input/options outcome. */
export function evaluatePrettify(
  input: string,
  options: InitialValuesType
): PrettifyResult {
  if (input === '') return { status: 'empty', value: '' };
  try {
    checkJsonInput(input);
    return {
      status: 'valid',
      value: checkJsonOutput(beautifyJson(input, options))
    };
  } catch (error) {
    const invalid =
      error instanceof Error && error.message === 'Invalid JSON string';
    return {
      status: invalid ? 'invalid' : 'unavailable',
      value: '',
      message:
        error instanceof JsonBudgetError
          ? error.message
          : invalid
            ? 'Invalid JSON string'
            : 'Could not format this JSON. Try a smaller or less deeply nested input.'
    };
  }
}
