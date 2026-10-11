import { executeRegex, type RegexInput } from './engine';
self.onmessage = (event: MessageEvent<RegexInput>) => {
  try {
    self.postMessage({ ok: true, result: executeRegex(event.data) });
  } catch (reason) {
    self.postMessage({
      ok: false,
      error:
        reason instanceof Error ? reason.message : 'Regex evaluation failed.'
    });
  }
};
