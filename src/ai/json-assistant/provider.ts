import { parseJson, type JsonValue } from './schema';
import { SAMPLES } from './samples';

export interface AssistantResult {
  source: 'authored-sample';
  explanation: string;
  suggestion: string;
}
export interface AssistantProvider {
  readonly mode: 'sample';
  explain(request: {
    input: string;
    signal?: AbortSignal;
    simulateError?: boolean;
  }): Promise<AssistantResult>;
}
const stable = (value: JsonValue): string => {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + stable(value[key]))
        .join(',') +
      '}'
    );
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return JSON.stringify(value);
};

/** Local provider only. A future Claude adapter belongs on the server and must
 * not change this interface to accept browser API keys. No fetch/network call. */
export const sampleProvider: AssistantProvider = {
  mode: 'sample',
  async explain({ input, signal, simulateError }) {
    await Promise.resolve();
    if (signal?.aborted) throw new Error('Demo cancelled.');
    if (simulateError)
      throw new Error(
        'Simulated demo error. No external service was contacted.'
      );
    const parsed = parseJson(input);
    const sample = SAMPLES.find(
      (item) => stable(item.input as JsonValue) === stable(parsed)
    );
    if (!sample)
      throw new Error(
        'No sample explanation matches this input. Load a sample, or use local schema and validation for your own JSON.'
      );
    return {
      source: 'authored-sample',
      explanation: sample.explanation,
      suggestion: sample.suggestion
    };
  }
};
