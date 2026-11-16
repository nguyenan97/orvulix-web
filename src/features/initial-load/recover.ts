/** Only retry already-requested, own-build JS preloads, never user/remote URLs. */
export function failedModuleUrls(
  preloads: string[],
  resources: { name: string; decodedBodySize: number }[],
  origin: string,
  base: string
): string[] {
  const root = new URL(`${base.replace(/\/$/, '')}/assets/`, origin);
  const loaded = new Set(
    resources.filter((r) => r.decodedBodySize > 0).map((r) => r.name)
  );
  const retry = new Set<string>();
  for (const href of preloads) {
    try {
      const url = new URL(href, origin);
      if (
        url.origin === root.origin &&
        !url.username &&
        !url.password &&
        url.pathname.startsWith(root.pathname) &&
        /\.m?js$/.test(url.pathname) &&
        !url.search &&
        !url.hash &&
        !loaded.has(url.href)
      )
        retry.add(url.href);
    } catch {
      /* An invalid link is not an asset recovery target. */
    }
    if (retry.size >= 32) break;
  }
  return [...retry];
}

export async function reloadRoute(): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    // WebKit can retain a failed module-preload result across a normal reload.
    // A bounded cache refresh on explicit recovery avoids that failed entry.
    const urls = failedModuleUrls(
      [
        ...document.querySelectorAll<HTMLLinkElement>(
          'link[rel="modulepreload"]'
        )
      ].map((link) => link.href),
      performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      window.location.origin,
      import.meta.env.BASE_URL
    );
    await Promise.allSettled(
      urls.map(async (url) => {
        const response = await fetch(url, {
          cache: 'reload',
          credentials: 'same-origin',
          redirect: 'error',
          signal: controller.signal
        });
        if (response.ok) await response.arrayBuffer();
      })
    );
  } finally {
    clearTimeout(timer);
    window.location.reload();
  }
}
