import type { Page } from '@playwright/test';

/** Delay startup only: successful reads still use native decoding and events. */
export async function deferTextReads(page: Page) {
  await page.addInitScript(() => {
    const native = FileReader.prototype.readAsText;
    const pending: (() => Promise<void>)[] = [];
    Object.assign(window, {
      releaseTextReads: async () => {
        for (const start of pending.splice(0)) await start();
      }
    });
    FileReader.prototype.readAsText = function (file, encoding) {
      pending.push(
        () =>
          new Promise<void>((resolve, reject) => {
            this.addEventListener('loadend', () => resolve(), { once: true });
            try {
              native.call(this, file, encoding);
            } catch (error) {
              reject(error);
            }
          })
      );
    };
  });
  return () =>
    page.evaluate(() =>
      (
        window as unknown as {
          releaseTextReads: () => Promise<void>;
        }
      ).releaseTextReads()
    );
}
