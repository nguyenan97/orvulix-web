import {
  LIMITS,
  WorkflowError,
  type Recipe,
  type WorkflowResult
} from './model';
import { checkRequest } from './recipe';
import { checkResult, type WorkflowRequest } from './protocol';

export interface WorkflowWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(request: WorkflowRequest): void;
  terminate(): void;
}
export interface RunnerOptions {
  createWorker?: () => WorkflowWorker;
  timeoutMs?: number;
}
const createWorker = () =>
  new Worker(new URL('./workflow.worker.ts', import.meta.url), {
    type: 'module'
  });
let identity = 0;

export function runWorkflow(
  input: string,
  recipe: Recipe,
  signal: AbortSignal,
  options: RunnerOptions = {}
): Promise<WorkflowResult> {
  return new Promise((resolve, reject) => {
    let checked: Recipe;
    try {
      checked = checkRequest(input, recipe);
    } catch (error) {
      reject(error);
      return;
    }
    if (signal.aborted) {
      reject(new WorkflowError('cancelled'));
      return;
    }
    const started = performance.now();
    const timeout = options.timeoutMs ?? LIMITS.timeoutMs;
    let worker: WorkflowWorker;
    try {
      worker = (options.createWorker ?? createWorker)();
    } catch {
      reject(new WorkflowError('worker-start'));
      return;
    }
    const runId = ++identity;
    let done = false;
    const finish = (result?: WorkflowResult, error?: WorkflowError) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    const abort = () => finish(undefined, new WorkflowError('cancelled'));
    const timer = setTimeout(
      () => finish(undefined, new WorkflowError('timeout')),
      Math.max(0, timeout - (performance.now() - started))
    );
    worker.onmessage = ({ data }) => {
      if (done || data?.runId !== runId) return;
      if (performance.now() - started >= timeout) {
        finish(undefined, new WorkflowError('timeout'));
        return;
      }
      try {
        finish(checkResult(data.result, checked.steps.length));
      } catch {
        finish(undefined, new WorkflowError('worker-message'));
      }
    };
    worker.onerror = () =>
      finish(undefined, new WorkflowError('worker-failed'));
    worker.onmessageerror = () =>
      finish(undefined, new WorkflowError('worker-message'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    if (performance.now() - started >= timeout) {
      finish(undefined, new WorkflowError('timeout'));
      return;
    }
    try {
      worker.postMessage({ runId, input, recipe: checked });
    } catch {
      finish(undefined, new WorkflowError('worker-failed'));
    }
  });
}
