import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { FileKind, InputFile } from './policy';
import { ImportSession } from './import-session';
import { prepareFile } from './prepare';
export function useMultiFileImport({
  value,
  onChange,
  accept,
  kind
}: {
  value: InputFile[];
  onChange: (files: InputFile[]) => void;
  accept: string[];
  kind: FileKind;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const nesting = useRef(0);
  const epoch = useRef(0);
  const mounted = useRef(true);
  const callbacks = useRef(onChange);
  callbacks.current = onChange;
  const session = useRef<ImportSession>();
  if (!session.current)
    session.current = new ImportSession(
      (files) => callbacks.current(files),
      setProcessing
    );
  useLayoutEffect(() => {
    if (session.current!.sync(value)) {
      epoch.current++;
      nesting.current = 0;
      setDragging(false);
      setError('');
    }
  }, [value]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      epoch.current++;
      session.current!.dispose();
    };
  }, []);
  const add = async (files: File[]) => {
    const generation = epoch.current;
    setError('');
    try {
      await session.current!.add(files, kind, accept, (file, signal) =>
        prepareFile(file, kind, signal)
      );
    } catch (error) {
      if (
        mounted.current &&
        generation === epoch.current &&
        !(error instanceof DOMException && error.name === 'AbortError')
      )
        setError(
          error instanceof Error ? error.message : 'File import failed.'
        );
    }
  };
  const clear = () => {
    epoch.current++;
    nesting.current = 0;
    setDragging(false);
    setError('');
    session.current!.clear();
  };
  const isFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes('Files');
  return {
    processing,
    error,
    dragging,
    clear,
    remove: (index: number) => session.current!.remove(index),
    pick: (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.currentTarget.files || []);
      event.currentTarget.value = '';
      if (files.length) void add(files);
    },
    handlers: {
      onDragEnter: (event: DragEvent<HTMLElement>) => {
        if (!isFiles(event)) return;
        event.preventDefault();
        nesting.current++;
        setDragging(true);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (isFiles(event)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!isFiles(event)) return;
        event.preventDefault();
        nesting.current = Math.max(0, nesting.current - 1);
        if (!nesting.current) setDragging(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!isFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        nesting.current = 0;
        setDragging(false);
        const directory = Array.from(event.dataTransfer.items || []).some(
          (item) => item.webkitGetAsEntry?.()?.isDirectory
        );
        if (directory) {
          setError('Directories are not supported. Drop individual files.');
          return;
        }
        void add(Array.from(event.dataTransfer.files));
      }
    }
  };
}
