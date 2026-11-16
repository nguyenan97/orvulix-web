import { sortJson } from '../../pages/tools/json/sort/service';
import type { InitialValuesType } from '../../pages/tools/json/sort/types';
import {
  getJsonHeaders,
  parseJsonInput,
  type JsonFormat
} from '../../utils/json';
import {
  checkJsonInput,
  checkJsonOutput,
  JsonBudgetError
} from '../json-resources/budget';

export type SortOutcome =
  | { status: 'empty'; value: ''; format: 'json' }
  | {
      status: 'invalid' | 'unavailable';
      value: '';
      format: 'json';
      message: string;
    }
  | { status: 'valid'; value: string; format: JsonFormat };

export function evaluateSort(
  input: string,
  options: InitialValuesType
): SortOutcome {
  if (input === '') return { status: 'empty', value: '', format: 'json' };
  try {
    checkJsonInput(input);
    const { result, format } = sortJson(input, options);
    return { status: 'valid', value: checkJsonOutput(result), format };
  } catch (error) {
    const syntax =
      error instanceof Error &&
      /^Invalid JSON(?::| at line \d+:)/.test(error.message);
    const shape =
      error instanceof Error &&
      [
        'Array is empty',
        'Input must be a JSON array',
        'Input must be a JSON object or array of objects'
      ].includes(error.message);
    return {
      status: syntax || shape ? 'invalid' : 'unavailable',
      value: '',
      format: 'json',
      message:
        error instanceof JsonBudgetError
          ? error.message
          : syntax
            ? 'Invalid JSON or JSON Lines input.'
            : shape
              ? error.message
              : 'Could not sort this input. Check the selected key and use an array of objects or a JSON object in key mode.'
    };
  }
}

// Header discovery must have the same admission gate as result evaluation.
export function inspectSortInput(input: string): {
  keys: string[];
  format: JsonFormat;
} {
  try {
    checkJsonInput(input);
    const { data, format } = parseJsonInput(input);
    const rows = (Array.isArray(data) ? data : [data]) as Record<
      string,
      string
    >[];
    return { keys: getJsonHeaders(rows), format };
  } catch {
    return { keys: [], format: 'json' };
  }
}
