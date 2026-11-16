import { useCallback, useLayoutEffect, useRef, type ChangeEvent } from 'react';
import { LIMITS, WorkflowError, type ErrorCode, type Recipe } from './model';
import { parseRecipe } from './recipe';

export function useRecipeImport(
  onRecipe: (recipe: Recipe) => void,
  onError: (code: ErrorCode) => void
) {
  const active = useRef<FileReader | null>(null);
  const callbacks = useRef({ onRecipe, onError });
  useLayoutEffect(() => {
    callbacks.current = { onRecipe, onError };
  });
  const cancel = useCallback(() => {
    const reader = active.current;
    active.current = null;
    if (!reader) return;
    reader.onload = reader.onerror = reader.onabort = null;
    if (reader.readyState === 1) reader.abort();
  }, []);
  useLayoutEffect(() => cancel, [cancel]);
  const pick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = '';
      if (!file) return;
      cancel();
      if (file.size > LIMITS.recipeBytes) {
        callbacks.current.onError('recipe-size');
        return;
      }
      try {
        const reader = new FileReader();
        active.current = reader;
        const fail = () => {
          if (active.current !== reader) return;
          cancel();
          callbacks.current.onError('recipe-read');
        };
        reader.onload = () => {
          if (active.current !== reader) return;
          const text = reader.result;
          cancel();
          if (typeof text !== 'string') {
            callbacks.current.onError('recipe-read');
            return;
          }
          let recipe: Recipe;
          try {
            recipe = parseRecipe(text);
          } catch (error) {
            callbacks.current.onError(
              error instanceof WorkflowError ? error.code : 'invalid-recipe'
            );
            return;
          }
          callbacks.current.onRecipe(recipe);
        };
        reader.onerror = reader.onabort = fail;
        reader.readAsText(file);
      } catch {
        cancel();
        callbacks.current.onError('recipe-read');
      }
    },
    [cancel]
  );
  return { cancel, pick };
}
