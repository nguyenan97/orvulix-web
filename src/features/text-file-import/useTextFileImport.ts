import { ChangeEvent, useCallback, useLayoutEffect, useRef } from 'react';

const READ_ERROR =
  'Could not read this file. Choose a readable text file and try again.';

/** Own one native text read. No persistence, transcoding or silent size truncation. */
export function useTextFileImport(
  value: string,
  onChange: (text: string) => void,
  onError: (message: string) => void
) {
  const active = useRef<FileReader | null>(null);
  const callbacks = useRef({ onChange, onError });
  useLayoutEffect(() => {
    callbacks.current = { onChange, onError };
  });
  const cancel = useCallback(() => {
    const reader = active.current;
    active.current = null;
    if (!reader) return;
    reader.onload = reader.onerror = reader.onabort = null;
    if (reader.readyState === 1) reader.abort();
  }, []);
  // External resets/options can replace value without an input gesture.
  useLayoutEffect(() => cancel, [value, cancel]);

  const edit = useCallback(
    (text: string) => {
      cancel();
      callbacks.current.onChange(text);
    },
    [cancel]
  );

  const pick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = ''; // Selecting the same file again must fire change.
      if (!file) return; // Dismissing the picker does not cancel an existing read.
      cancel();
      try {
        const reader = new FileReader();
        active.current = reader;
        const fail = () => {
          if (active.current !== reader) return;
          cancel();
          callbacks.current.onError(READ_ERROR);
        };
        reader.onload = () => {
          if (active.current !== reader) return;
          const text = reader.result;
          if (typeof text !== 'string') {
            fail();
            return;
          }
          cancel();
          callbacks.current.onChange(text);
        };
        reader.onerror = fail;
        reader.onabort = fail;
        reader.readAsText(file);
      } catch {
        cancel();
        callbacks.current.onError(READ_ERROR);
      }
    },
    [cancel]
  );
  return { pick, edit };
}
