// Admission limits apply to the three JSON tools, not every inherited parser.
export const JSON_INPUT_UNITS = 256 * 1024;
export const JSON_OUTPUT_UNITS = 2 * 1024 * 1024;
export const JSON_DEPTH = 64;
export const JSON_TOKENS = 20000;

export class JsonBudgetError extends Error {}

/** Constant-space lexical admission before JSON.parse, including JSONL.
 * This is not syntax validation. Quotes/escapes hide structural characters;
 * the existing parser remains authoritative for every admitted document.
 */
export function checkJsonInput(input: string): void {
  if (input.length > JSON_INPUT_UNITS)
    throw new JsonBudgetError(
      'JSON input is too large. Use a smaller document (about 256K characters).'
    );
  let depth = 0;
  let tokens = 0;
  let quoted = false;
  let escaped = false;
  let primitive = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') {
      quoted = true;
      primitive = false;
      tokens++;
    } else if (char === '[' || char === '{') {
      if (++depth > JSON_DEPTH)
        throw new JsonBudgetError(
          'JSON nesting exceeds 64 levels. Use a less deeply nested document.'
        );
      primitive = false;
      tokens++;
    } else if (char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
      primitive = false;
    } else if (char === ':' || char === ',' || /\s/.test(char)) {
      primitive = false;
    } else if (!primitive) {
      primitive = true;
      tokens++;
    }
    if (tokens > JSON_TOKENS)
      throw new JsonBudgetError(
        'JSON has too many values or keys (limit: 20,000). Use a smaller document.'
      );
  }
}

/** The input/depth/token limits also bound the serializer's temporary work. */
export function checkJsonOutput(value: string): string {
  if (value.length > JSON_OUTPUT_UNITS)
    throw new JsonBudgetError(
      'JSON output is too large. Use a smaller document or less indentation.'
    );
  return value;
}
