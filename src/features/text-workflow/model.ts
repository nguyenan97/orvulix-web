import type { DuplicateRemoverOptions } from '../../pages/tools/string/remove-duplicate-lines/service';

export const LIMITS = {
  input: 65_536,
  steps: 16,
  output: 262_144,
  retained: 1_048_576,
  recipeBytes: 32_768,
  recipeText: 32_768,
  timeoutMs: 5_000
} as const;

export type Step =
  | { type: 'trim' | 'uppercase' | 'reverse'; options: Record<string, never> }
  | { type: 'base64' | 'url'; options: { mode: 'encode' | 'decode' } }
  | { type: 'deduplicate'; options: DuplicateRemoverOptions };
export type StepType = Step['type'];
export interface Recipe {
  version: 1;
  steps: Step[];
}

export const STEP_LABELS: Record<StepType, string> = {
  trim: 'Trim',
  uppercase: 'Uppercase',
  reverse: 'Reverse',
  deduplicate: 'Remove duplicate lines',
  base64: 'Base64',
  url: 'URL component'
};

export function newStep(type: StepType): Step {
  if (type === 'base64' || type === 'url')
    return { type, options: { mode: 'encode' } };
  if (type === 'deduplicate')
    return {
      type,
      options: {
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      }
    };
  return { type, options: {} };
}

export const ERRORS = {
  'invalid-recipe':
    'Invalid recipe. Use version 1 with supported steps and options only.',
  'recipe-size':
    'Recipe is too large. Limit: 32,768 bytes per file and 32,768 text units.',
  'recipe-read':
    'Could not read this recipe. Choose a readable JSON file and try again.',
  'input-size': 'Input is too large. Limit: 65,536 UTF-16 text units.',
  'empty-input': 'Enter input text before running the workflow.',
  'empty-steps': 'Add at least one step before running the workflow.',
  'output-size': 'Step output is too large. Limit: 262,144 UTF-16 text units.',
  'retained-size':
    'Intermediate outputs exceed 1,048,576 UTF-16 text units. Use fewer steps or shorter input.',
  'invalid-base64':
    'Invalid Base64. Use the standard alphabet and canonical padding.',
  'invalid-utf8': 'Base64 must decode to valid UTF-8 text.',
  'invalid-unicode': 'This encoding requires well-formed Unicode text.',
  'invalid-url': 'Invalid URL component encoding.',
  'segmenter-unavailable':
    'Grapheme reverse requires a browser with Intl.Segmenter support.',
  'step-failed': 'This step could not process the text.',
  'worker-start':
    'Could not start the workflow worker. Check browser support and worker permissions.',
  'worker-failed': 'The workflow worker failed. Try again.',
  'worker-message': 'Invalid workflow worker response. Try again.',
  timeout:
    'Workflow timed out after 5 seconds. Shorten the input or simplify the workflow.',
  cancelled: 'Workflow cancelled.'
} as const;
export type ErrorCode = keyof typeof ERRORS;
export class WorkflowError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(ERRORS[code]);
  }
}
export type WorkflowResult =
  | { kind: 'success'; outputs: string[] }
  | {
      kind: 'error';
      outputs: string[];
      failedStep: number | null;
      error: ErrorCode;
    };

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(ERRORS, value);
}
