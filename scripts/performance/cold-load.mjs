import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { clsScore } from './metrics.mjs';

// Repeatable local lab observation, not Lighthouse scoring or field Web Vitals.
const base = process.env.PERF_BASE_URL || 'http://127.0.0.1:4173';
const output = resolve(process.argv[2] || 'output/playwright/cold-load.json');
const runs = Number(process.env.PERF_RUNS || 3);
const profile = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  cpuSlowdown: 4,
  latencyMs: 150,
  downloadBytesPerSecond: 200_000,
  uploadBytesPerSecond: 93_750,
  observationAfterReadyMs: 2000
};
const routes = [
  { path: '/', ready: 'input[role="combobox"]' },
  { path: '/string/reverse', ready: 'textarea:not([aria-hidden="true"])' },
  { path: '/pdf/split-pdf', ready: 'input[type="file"]', hidden: true }
];
if (!Number.isInteger(runs) || runs < 1 || runs > 10)
  throw Error('PERF_RUNS must be between 1 and 10.');
const browser = await chromium.launch();
const samples = [];
await mkdir(dirname(output), { recursive: true });
try {
  for (const route of routes) {
    for (let iteration = 1; iteration <= runs; iteration++) {
      const context = await browser.newContext({
        viewport: profile.viewport,
        deviceScaleFactor: profile.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
        locale: 'en-US',
        colorScheme: 'light',
        serviceWorkers: 'block'
      });
      try {
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: profile.latencyMs,
          downloadThroughput: profile.downloadBytesPerSecond,
          uploadThroughput: profile.uploadBytesPerSecond,
          connectionType: 'cellular4g'
        });
        await cdp.send('Emulation.setCPUThrottlingRate', {
          rate: profile.cpuSlowdown
        });
        const requests = new Map();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        cdp.on('Network.requestWillBeSent', (event) => {
          requests.set(event.requestId, {
            url: event.request.url,
            type: event.type,
            start: event.timestamp,
            initiator: event.initiator.type,
            parent: event.initiator.stack?.callFrames?.[0]?.url
          });
        });
        cdp.on('Network.responseReceived', (event) => {
          Object.assign(requests.get(event.requestId) || {}, {
            status: event.response.status,
            mime: event.response.mimeType,
            response: event.timestamp,
            cache: event.response.fromDiskCache || false
          });
        });
        cdp.on('Network.loadingFinished', (event) => {
          Object.assign(requests.get(event.requestId) || {}, {
            end: event.timestamp,
            encodedBytes: event.encodedDataLength
          });
        });
        cdp.on('Network.loadingFailed', (event) => {
          Object.assign(requests.get(event.requestId) || {}, {
            failed: event.errorText
          });
        });
        await page.addInitScript(
          ({ selector, hidden }) => {
            const data = (window.__coldLoad = {
              lcp: null,
              cls: 0,
              longTasks: [],
              ready: null,
              firstContent: null,
              shifts: []
            });
            for (const type of [
              'largest-contentful-paint',
              'layout-shift',
              'longtask'
            ]) {
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (type === 'largest-contentful-paint')
                    data.lcp = entry.startTime;
                  if (type === 'layout-shift' && !entry.hadRecentInput) {
                    data.cls += entry.value;
                    data.shifts.push({
                      time: entry.startTime,
                      value: entry.value,
                      sources: entry.sources?.map((source) => ({
                        tag: source.node?.nodeName,
                        text: source.node?.textContent?.slice(0, 80),
                        previous: source.previousRect?.toJSON(),
                        current: source.currentRect?.toJSON()
                      }))
                    });
                  }
                  if (type === 'longtask')
                    data.longTasks.push({
                      start: entry.startTime,
                      duration: entry.duration
                    });
                }
              }).observe({ type, buffered: true });
            }
            function observe() {
              if (
                document.querySelector('#root h1') &&
                data.firstContent === null
              )
                data.firstContent = performance.now();
              const control = document.querySelector(selector);
              if (
                control &&
                (hidden || control.getClientRects().length) &&
                data.ready === null
              )
                data.ready = performance.now();
            }
            new MutationObserver(observe).observe(document, {
              childList: true,
              subtree: true
            });
          },
          { selector: route.ready, hidden: route.hidden }
        );
        await page.goto(
          new URL(route.path.replace(/^\//, ''), `${base.replace(/\/$/, '')}/`)
            .href,
          { waitUntil: 'domcontentloaded', timeout: 90_000 }
        );
        await page
          .locator(route.ready)
          .first()
          .waitFor({
            state: route.hidden ? 'attached' : 'visible',
            timeout: 90_000
          });
        // Fixed observation window is part of the measurement protocol, not test readiness.
        await page.waitForTimeout(profile.observationAfterReadyMs);
        const metrics = await page.evaluate(() => ({
          ...window.__coldLoad,
          paints: performance
            .getEntriesByType('paint')
            .map(({ name, startTime }) => ({ name, startTime })),
          navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
          resources: performance
            .getEntriesByType('resource')
            .map((entry) => entry.toJSON()),
          overflow: document.documentElement.scrollWidth > innerWidth
        }));
        const network = [...requests.values()].filter((r) =>
          /^https?:/.test(r.url)
        );
        const bytes = (type) =>
          network
            .filter((r) => type.includes(r.type))
            .reduce((sum, r) => sum + (r.encodedBytes || 0), 0);
        const sample = {
          route: route.path,
          iteration,
          ...metrics,
          layoutShiftSum: metrics.cls,
          cls: clsScore(metrics.shifts),
          errors,
          jsBytes: bytes(['Script']),
          cssBytes: bytes(['Stylesheet']),
          requestCount: network.length,
          network,
          totalBlockingMs: metrics.longTasks.reduce(
            (sum, task) => sum + Math.max(0, task.duration - 50),
            0
          )
        };
        samples.push(sample);
        console.log(
          JSON.stringify({
            route: sample.route,
            iteration,
            lcp: sample.lcp,
            cls: sample.cls,
            ready: sample.ready,
            jsBytes: sample.jsBytes,
            requests: sample.requestCount,
            blocking: sample.totalBlockingMs,
            errors: sample.errors,
            overflow: sample.overflow
          })
        );
        if (iteration === 1)
          await page.screenshot({
            path: output.replace(
              /\.json$/,
              `-${route.path.replace(/\W/g, '_')}.png`
            ),
            fullPage: false
          });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        browser: browser.version(),
        base,
        profile,
        samples
      },
      null,
      2
    )
  );
}
