import { FileKind, InputFile, validateBatch } from './policy';
export type PrepareFile = (file: File, signal: AbortSignal) => Promise<File>;
/** Serial, atomically published batches. Pending reservations bound retained files. */
export class ImportSession {
  private value: InputFile[] = [];
  private reserved = new Set<File[]>();
  private urls = new Set<string>();
  private controller = new AbortController();
  private tail: Promise<void> = Promise.resolve();
  constructor(
    private publish: (value: InputFile[]) => void,
    private busy: (value: boolean) => void
  ) {}
  private releaseUnused() {
    const used = new Set(this.value.map((item) => item.preview));
    for (const url of this.urls)
      if (!used.has(url)) {
        URL.revokeObjectURL(url);
        this.urls.delete(url);
      }
  }
  sync(value: InputFile[]) {
    if (value === this.value) return false;
    this.cancel();
    this.value = value;
    this.releaseUnused();
    return true;
  }
  private cancel() {
    this.controller.abort();
    this.controller = new AbortController();
    this.reserved.clear();
    this.tail = Promise.resolve();
    this.busy(false);
  }
  clear() {
    this.cancel();
    this.update([]);
  }
  remove(index: number) {
    this.update(this.value.filter((_, i) => i !== index));
  }
  private update(value: InputFile[]) {
    this.value = value;
    this.releaseUnused();
    this.publish(value);
  }
  dispose() {
    this.controller.abort();
    this.controller = new AbortController();
    this.reserved.clear();
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
  }
  add(
    files: File[],
    kind: FileKind,
    accept: readonly string[],
    prepare: PrepareFile
  ): Promise<void> {
    validateBatch(
      files,
      [
        ...this.value.map((item) => item.file),
        ...Array.from(this.reserved).flat()
      ],
      kind,
      accept
    );
    const signal = this.controller.signal;
    this.reserved.add(files);
    this.busy(true);
    const run = this.tail.then(async () => {
      const prepared: InputFile[] = [];
      try {
        signal.throwIfAborted();
        for (const file of files) {
          const result = await prepare(file, signal);
          signal.throwIfAborted();
          const others = [
            ...this.value.map((item) => item.file),
            ...Array.from(this.reserved)
              .filter((batch) => batch !== files)
              .flat()
          ];
          validateBatch(
            [...prepared.map((item) => item.file), result],
            others,
            kind,
            []
          );
          // Output validation skips MIME rules: HEIC can become JPEG.
          prepared.push({ file: result, order: 0 });
        }
        signal.throwIfAborted();
        const next =
          this.value.reduce((max, item) => Math.max(max, item.order), -1) + 1;
        const imported = prepared.map((item, index) => {
          const preview =
            kind === 'image' ? URL.createObjectURL(item.file) : undefined;
          if (preview) this.urls.add(preview);
          return { ...item, order: next + index, preview };
        });
        this.update([...this.value, ...imported]);
      } finally {
        this.reserved.delete(files);
        this.releaseUnused();
        if (!signal.aborted) this.busy(this.reserved.size > 0);
      }
    });
    this.tail = run.catch(() => {});
    return run;
  }
}
