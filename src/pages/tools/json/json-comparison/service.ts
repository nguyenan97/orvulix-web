import {
  checkJsonInput,
  checkJsonOutput,
  JSON_OUTPUT_UNITS,
  JsonBudgetError
} from '../../../../features/json-resources/budget';

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Retain trailing-comma compatibility without touching quoted string data. */
function withoutTrailingCommas(source: string): string {
  let quoted = false;
  let escaped = false;
  let previous = '';
  let result = '';
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') {
        quoted = false;
        previous = '"';
      }
      continue;
    }
    if (char === '"') quoted = true;
    if (char === ',' && previous && !'[{,:'.includes(previous)) {
      let next = i + 1;
      while (next < source.length && /[ \t\r\n]/.test(source[next])) next++;
      if (source[next] === '}' || source[next] === ']') continue;
    }
    result += char;
    if (!/[ \t\r\n]/.test(char)) previous = char;
  }
  return result;
}

function parse(source: string, label: string): JsonValue {
  try {
    checkJsonInput(source);
    return JSON.parse(
      withoutTrailingCommas(source.trim() || '{}')
    ) as JsonValue;
  } catch (error) {
    throw new Error(
      `${label}: ${
        error instanceof JsonBudgetError
          ? error.message
          : 'Invalid JSON format.'
      }`
    );
  }
}

const kind = (value: JsonValue): string =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

function childPath(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$|^\d+$/.test(key)
    ? `${path}${path ? '.' : ''}${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

function display(value: JsonValue, typed: boolean): string {
  return typeof value === 'object' || (typed && typeof value === 'string')
    ? JSON.stringify(value)
    : String(value);
}

/** Own-key recursive value comparison; no reference equality or prototype lookup. */
export function compareJson(
  json1: string,
  json2: string,
  format: 'text' | 'json'
): string {
  if (!json1.trim() && !json2.trim()) return '';
  const first = parse(json1, 'First JSON');
  const second = parse(json2, 'Second JSON');
  const differences: Record<string, string> = Object.create(null);
  let outputUnits = 0;
  const add = (path: string, message: string) => {
    outputUnits += path.length + message.length + 16;
    if (outputUnits > JSON_OUTPUT_UNITS)
      throw new JsonBudgetError(
        'JSON comparison output is too large. Compare smaller documents.'
      );
    differences[path || 'root'] = message;
  };
  const visit = (left: JsonValue, right: JsonValue, path: string) => {
    if (left === right) return;
    const sameKind = kind(left) === kind(right);
    if (
      sameKind &&
      left !== null &&
      right !== null &&
      typeof left === 'object' &&
      typeof right === 'object'
    ) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
      for (const key of keys) {
        const next = childPath(path, key);
        if (!Object.hasOwn(left, key)) add(next, 'Missing in first JSON');
        else if (!Object.hasOwn(right, key))
          add(next, 'Missing in second JSON');
        else
          visit(
            Reflect.get(left, key) as JsonValue,
            Reflect.get(right, key) as JsonValue,
            next
          );
      }
    } else {
      add(
        path,
        `Mismatch: ${display(left, !sameKind)} != ${display(right, !sameKind)}`
      );
    }
  };
  visit(first, second, '');
  return checkJsonOutput(
    format === 'json'
      ? JSON.stringify(differences)
      : Object.entries(differences)
          .map(([path, message]) => `${path}: ${message}`)
          .join('\n') || 'No differences found'
  );
}
