import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';
import { useRecipeImport } from './useRecipeImport';
import { LIMITS } from './model';

class Reader {
  static instances: Reader[] = [];
  readyState = 0;
  result: unknown = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  abort = vi.fn(() => {
    this.readyState = 2;
    this.onabort?.();
  });
  readAsText = vi.fn(() => {
    this.readyState = 1;
  });
  constructor() {
    Reader.instances.push(this);
  }
  finish(text: unknown) {
    this.result = text;
    this.readyState = 2;
    this.onload?.();
  }
}
const event = (file?: File) =>
  ({
    currentTarget: { files: file ? [file] : [], value: 'selected' }
  }) as unknown as ChangeEvent<HTMLInputElement>;
const source = '{"version":1,"steps":[{"type":"trim","options":{}}]}';
afterEach(() => {
  vi.unstubAllGlobals();
  Reader.instances = [];
});
function setup() {
  vi.stubGlobal('FileReader', Reader);
  const accepted = vi.fn(),
    error = vi.fn();
  return {
    accepted,
    error,
    ...renderHook(() => useRecipeImport(accepted, error))
  };
}
describe('bounded atomic recipe import', () => {
  it('rejects one-over bytes before FileReader, admits exact bytes and resets picker', () => {
    const hook = setup();
    act(() =>
      hook.result.current.pick(
        event(new File(['x'.repeat(LIMITS.recipeBytes + 1)], 'large.json'))
      )
    );
    expect(Reader.instances).toHaveLength(0);
    expect(hook.error).toHaveBeenCalledWith('recipe-size');
    const pick = event(
      new File([source.padEnd(LIMITS.recipeBytes, ' ')], 'exact.json')
    );
    act(() => hook.result.current.pick(pick));
    expect(pick.currentTarget.value).toBe('');
    act(() =>
      Reader.instances[0].finish(source.padEnd(LIMITS.recipeText, ' '))
    );
    expect(hook.accepted).toHaveBeenCalledWith({
      version: 1,
      steps: [{ type: 'trim', options: {} }]
    });
  });
  it('does not partially publish malformed/oversized decoded text and supports same-file retry', () => {
    const hook = setup(),
      file = new File([source], 'recipe.json');
    for (const text of ['{', source + ' '.repeat(LIMITS.recipeText)]) {
      act(() => hook.result.current.pick(event(file)));
      act(() => Reader.instances.at(-1)!.finish(text));
    }
    expect(hook.accepted).not.toHaveBeenCalled();
    expect(hook.error.mock.calls).toEqual([
      ['invalid-recipe'],
      ['recipe-size']
    ]);
    act(() => hook.result.current.pick(event(file)));
    act(() => Reader.instances.at(-1)!.finish(source));
    expect(hook.accepted).toHaveBeenCalledTimes(1);
  });
  it('cancels replacement/edits/unmount and ignores captured late callbacks', () => {
    const hook = setup(),
      file = new File([source], 'recipe.json');
    act(() => hook.result.current.pick(event(file)));
    const old = Reader.instances[0],
      late = old.onload!;
    act(() => hook.result.current.pick(event(file)));
    expect(old.abort).toHaveBeenCalledTimes(1);
    old.result = source;
    act(() => late());
    expect(hook.accepted).not.toHaveBeenCalled();
    act(() => hook.result.current.cancel());
    expect(Reader.instances[1].abort).toHaveBeenCalledTimes(1);
    act(() => hook.result.current.pick(event(file)));
    hook.unmount();
    expect(Reader.instances[2].abort).toHaveBeenCalledTimes(1);
  });
  it('reports native read failures and permits a new import', () => {
    const hook = setup();
    act(() =>
      hook.result.current.pick(event(new File([source], 'recipe.json')))
    );
    act(() => Reader.instances[0].onerror?.());
    expect(hook.error).toHaveBeenCalledWith('recipe-read');
    expect(hook.accepted).not.toHaveBeenCalled();
    act(() =>
      hook.result.current.pick(event(new File([source], 'recipe.json')))
    );
    act(() => Reader.instances[1].finish(source));
    expect(hook.accepted).toHaveBeenCalledTimes(1);
  });
});
