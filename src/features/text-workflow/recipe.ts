import { LIMITS, WorkflowError, type Recipe, type Step } from './model';

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function fields(value: Record<string, unknown>, keys: string[]) {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
const invalid = (): never => {
  throw new WorkflowError('invalid-recipe');
};

/** Fixed-depth whitelist. Never merge untrusted objects into application state. */
export function validateRecipe(value: unknown): Recipe {
  if (
    !object(value) ||
    !fields(value, ['version', 'steps']) ||
    value.version !== 1 ||
    !Array.isArray(value.steps) ||
    value.steps.length > LIMITS.steps
  )
    return invalid();
  const steps = value.steps.map((item: unknown): Step => {
    if (
      !object(item) ||
      !fields(item, ['type', 'options']) ||
      !object(item.options)
    )
      return invalid();
    const options = item.options;
    switch (item.type) {
      case 'trim':
      case 'uppercase':
      case 'reverse':
        if (!fields(options, [])) return invalid();
        return { type: item.type, options: {} };
      case 'base64':
      case 'url':
        if (
          !fields(options, ['mode']) ||
          (options.mode !== 'encode' && options.mode !== 'decode')
        )
          return invalid();
        return { type: item.type, options: { mode: options.mode } };
      case 'deduplicate':
        if (
          !fields(options, [
            'mode',
            'newlines',
            'sortLines',
            'trimTextLines'
          ]) ||
          (options.mode !== 'all' &&
            options.mode !== 'consecutive' &&
            options.mode !== 'unique') ||
          (options.newlines !== 'filter' &&
            options.newlines !== 'preserve' &&
            options.newlines !== 'delete') ||
          typeof options.sortLines !== 'boolean' ||
          typeof options.trimTextLines !== 'boolean'
        )
          return invalid();
        return {
          type: item.type,
          options: {
            mode: options.mode,
            newlines: options.newlines,
            sortLines: options.sortLines,
            trimTextLines: options.trimTextLines
          }
        };
      default:
        return invalid();
    }
  });
  return { version: 1, steps };
}

export function parseRecipe(text: string): Recipe {
  if (text.length > LIMITS.recipeText) throw new WorkflowError('recipe-size');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return invalid();
  }
  return validateRecipe(value);
}
export function exportRecipe(recipe: Recipe): string {
  return JSON.stringify(validateRecipe(recipe), null, 2) + '\n';
}

export function checkRequest(input: unknown, recipe: unknown): Recipe {
  if (typeof input !== 'string' || input.length > LIMITS.input)
    throw new WorkflowError('input-size');
  const checked = validateRecipe(recipe);
  if (!input.length) throw new WorkflowError('empty-input');
  if (!checked.steps.length) throw new WorkflowError('empty-steps');
  return checked;
}
