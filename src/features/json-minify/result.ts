import { minifyJson } from '../../pages/tools/json/minify/service';
import type { JsonFormat } from '../../utils/json';
import {
  checkJsonInput,
  checkJsonOutput,
  JsonBudgetError
} from '../json-resources/budget';

export type MinifyOutcome =
  | { status: 'empty'; value: ''; format: 'json' }
  | {
      status: 'invalid' | 'unavailable';
      value: '';
      format: 'json';
      message: string;
    }
  | { status: 'valid'; value: string; format: JsonFormat };

/** Preserve JSON/JSONL service semantics without retaining prior output/errors. */
export function evaluateMinify(input: string): MinifyOutcome {
  if (input === '') return { status: 'empty', value: '', format: 'json' };
  try {
    checkJsonInput(input);
    const { result, format } = minifyJson(input);
    return { status: 'valid', value: checkJsonOutput(result), format };
  } catch (error) {
    // parseJsonInput wraps syntax failures with these controlled prefixes.
    // Do not display its native message: it may contain user-supplied text.
    const invalid =
      error instanceof Error &&
      /^Invalid JSON(?::| at line \d+:)/.test(error.message);
    return {
      status: invalid ? 'invalid' : 'unavailable',
      value: '',
      format: 'json',
      message:
        error instanceof JsonBudgetError
          ? error.message
          : invalid
            ? 'Invalid JSON or JSON Lines input.'
            : 'Could not minify this input. Try smaller or less deeply nested JSON.'
    };
  }
}

/** Only this tool bypasses ToolContent's legacy queued compute effect. */
export function resultIsDerived() {
  /* The page derives current output and validity during render. */
}
