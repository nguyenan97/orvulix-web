import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { WorkflowError, type Recipe, type WorkflowResult } from './model';
import { runWorkflow } from './runner';

type Run = { input: string; recipe: Recipe; result: WorkflowResult | null };
export function useWorkflow(
  input: string,
  recipe: Recipe,
  runner = runWorkflow
) {
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<Run | null>(null);
  const stop = useCallback(() => {
    const controller = active.current;
    active.current = null;
    controller?.abort();
  }, []);
  useLayoutEffect(() => {
    stop();
    return stop;
  }, [input, recipe, stop]);
  const cancel = useCallback(() => {
    stop();
    setState(null);
  }, [stop]);
  const run = useCallback(() => {
    stop();
    const controller = new AbortController();
    active.current = controller;
    setState({ input, recipe, result: null });
    runner(input, recipe, controller.signal)
      .then((result) => {
        if (active.current !== controller) return;
        active.current = null;
        setState({ input, recipe, result });
      })
      .catch((error) => {
        if (active.current !== controller) return;
        active.current = null;
        setState({
          input,
          recipe,
          result: {
            kind: 'error',
            outputs: [],
            failedStep: null,
            error: error instanceof WorkflowError ? error.code : 'worker-failed'
          }
        });
      });
  }, [input, recipe, runner, stop]);
  // Also guard rendering before layout cleanup can cancel an external replacement.
  const current =
    state?.input === input && state.recipe === recipe ? state : null;
  return {
    run,
    cancel,
    result: current?.result ?? null,
    running: current !== null && current.result === null
  };
}
