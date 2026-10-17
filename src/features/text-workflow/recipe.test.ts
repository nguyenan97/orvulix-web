import { describe, expect, it } from 'vitest';
import { LIMITS, newStep } from './model';
import { exportRecipe, parseRecipe, validateRecipe } from './recipe';

describe('workflow recipe whitelist', () => {
  it('round-trips every operation and contains configuration only', () => {
    const recipe = {
      version: 1 as const,
      steps: [
        newStep('trim'),
        newStep('uppercase'),
        newStep('reverse'),
        newStep('deduplicate'),
        newStep('base64'),
        newStep('url')
      ]
    };
    expect(parseRecipe(exportRecipe(recipe))).toEqual(recipe);
    expect(exportRecipe({ version: 1, steps: [newStep('trim')] })).toBe(
      '{\n  "version": 1,\n  "steps": [\n    {\n      "type": "trim",\n      "options": {}\n    }\n  ]\n}\n'
    );
  });
  it.each([
    'null',
    '[]',
    '{}',
    '{',
    '{"version":2,"steps":[]}',
    '{"version":1,"steps":[],"input":"secret"}',
    '{"version":1,"steps":[{"type":"eval","options":{}}]}',
    '{"version":1,"steps":[{"type":"trim","options":{"__proto__":{}}}]}',
    '{"version":1,"steps":[{"type":"base64","options":{"mode":"encode","extra":true}}]}',
    '{"version":1,"steps":[{"type":"base64","options":{"mode":false}}]}',
    '{"version":1,"steps":[{"type":"deduplicate","options":{"mode":"all","newlines":"filter","sortLines":"false","trimTextLines":false}}]}',
    '{"version":1,"steps":[{"type":"trim","options":[],"constructor":"x"}]}'
  ])('rejects malformed or unknown fields: %s', (text) => {
    expect(() => parseRecipe(text)).toThrow('Invalid recipe.');
  });
  it('accepts 0/16 steps and rejects 17, without mutating or retaining supplied objects', () => {
    expect(validateRecipe({ version: 1, steps: [] }).steps).toEqual([]);
    const recipe = {
      version: 1,
      steps: Array.from({ length: LIMITS.steps }, () => newStep('uppercase'))
    };
    const checked = validateRecipe(recipe);
    expect(checked.steps).toHaveLength(16);
    expect(checked.steps[0]).not.toBe(recipe.steps[0]);
    expect(() =>
      validateRecipe({ ...recipe, steps: [...recipe.steps, newStep('trim')] })
    ).toThrow('Invalid recipe.');
  });
  it('checks exact and one-over text size before parsing, then recovers', () => {
    const source = '{"version":1,"steps":[]}';
    const exact = source.padEnd(LIMITS.recipeText, ' ');
    expect(parseRecipe(exact)).toEqual({ version: 1, steps: [] });
    expect(() => parseRecipe(exact + ' ')).toThrow('Recipe is too large.');
    expect(parseRecipe(source)).toEqual({ version: 1, steps: [] });
  });
});
