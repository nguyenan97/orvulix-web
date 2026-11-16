import {
  LIMITS,
  WorkflowError,
  isErrorCode,
  type Recipe,
  type WorkflowResult
} from './model';
export interface WorkflowRequest {
  runId: number;
  input: string;
  recipe: Recipe;
}

/** Validate the message boundary before publishing any worker output to React. */
export function checkResult(value: unknown, steps: number): WorkflowResult {
  const bad = (): never => {
    throw new WorkflowError('worker-message');
  };
  if (!value || typeof value !== 'object') return bad();
  const result = value as Record<string, unknown>;
  if (
    !Array.isArray(result.outputs) ||
    result.outputs.length > steps ||
    result.outputs.length > LIMITS.steps
  )
    return bad();
  let retained = 0;
  for (const output of result.outputs) {
    if (typeof output !== 'string' || output.length > LIMITS.output)
      return bad();
    retained += output.length;
    if (retained > LIMITS.retained) return bad();
  }
  const outputs = result.outputs as string[];
  if (result.kind === 'success' && outputs.length === steps && steps > 0)
    return { kind: 'success', outputs };
  if (result.kind !== 'error' || !isErrorCode(result.error)) return bad();
  if (result.failedStep === null && outputs.length === 0)
    return { kind: 'error', outputs, failedStep: null, error: result.error };
  if (
    typeof result.failedStep !== 'number' ||
    !Number.isInteger(result.failedStep) ||
    result.failedStep < 0 ||
    result.failedStep >= steps ||
    result.failedStep !== outputs.length
  )
    return bad();
  return {
    kind: 'error',
    outputs,
    failedStep: result.failedStep,
    error: result.error
  };
}
