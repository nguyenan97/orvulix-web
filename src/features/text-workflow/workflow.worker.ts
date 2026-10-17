import { executeWorkflow } from './engine';
import type { WorkflowRequest } from './protocol';
self.onmessage = ({ data }: MessageEvent<WorkflowRequest>) => {
  self.postMessage({
    runId: data.runId,
    result: executeWorkflow(data.input, data.recipe)
  });
};
