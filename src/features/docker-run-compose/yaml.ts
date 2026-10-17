import { ConversionError, LIMITS, type Yaml } from './model';

/** Controlled schema, JSON-quoted YAML scalars, literal Compose dollars. */
export function serialize(document: Yaml): string {
  const lines: string[] = [];
  let size = 0;
  const line = (text: string) => {
    size += text.length + 1;
    if (size > LIMITS.output) throw new ConversionError('output');
    lines.push(text);
  };
  const scalar = (value: string | boolean | null) =>
    typeof value === 'string'
      ? JSON.stringify(value.replace(/\$/g, () => '$$')).replace(
          /[\u007f-\u009f\u2028\u2029]/g,
          (character) =>
            `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
        )
      : JSON.stringify(value);
  const visit = (value: Yaml, depth: number) => {
    const pad = ' '.repeat(depth);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && typeof item === 'object') {
          line(`${pad}-`);
          visit(item, depth + 2);
        } else line(`${pad}- ${scalar(item)}`);
      }
    } else if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        const label = JSON.stringify(key);
        if (item !== null && typeof item === 'object') {
          if (Object.keys(item).length === 0)
            line(`${pad}${label}: ${Array.isArray(item) ? '[]' : '{}'}`);
          else {
            line(`${pad}${label}:`);
            visit(item, depth + 2);
          }
        } else line(`${pad}${label}: ${scalar(item)}`);
      }
    }
  };
  visit(document, 0);
  return lines.join('\n') + '\n';
}
