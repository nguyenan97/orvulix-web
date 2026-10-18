# Initial load and quality review

Reviewed 2026-10-18. Task PR: [#43](https://github.com/nguyenan97/orvulix-web/pull/43),
target develop. Baseline a74c46c0ac9161eb1bbf7ba92cbf686e217e1bfa;
runtime revision 752391157eb77c40c9c905eddf0f3a019a6355ca.
Final documentation commits do not change the measured application.

## Scope and findings

The repository is React 18 / TypeScript / Vite 6 with MUI, React Router,
137 tools and 159 prerendered indexable routes. This review covers startup,
the shared shell, SEO/i18n, Reverse String and Split PDF. It is not an audit
of the correctness or resource budgets of every tool.

| Severity | File / trigger | Evidence and impact | Correction |
| --- | --- | --- | --- |
| P1 | `src/components/App.tsx`, `src/tools/defineTool.tsx`, `src/seo/RouteSeo.tsx`: direct tool entry | Router called all 137 wrappers as functions; all 13 namespaces were requested. Holding an unrelated namespace prevented the active tool from becoming usable. | Construct React route elements once; subscribe to active namespaces. Existing English shell strings are bundled. |
| P1 | `src/features/initial-load/RouteErrorBoundary.tsx`: failed lazy route request | Aborting the Split PDF chunk left no usable recovery UI. WebKit retained the failed module preload through plain reload, reproduced with abort and HTTP 503. | Route boundary retains shell/navigation and offers explicit reload. Recovery refreshes only missing own-origin build JS preloads, max 32, with a 4s abort deadline. No startup prefetch. |
| P2 | `src/seo/model.ts`, `src/seo/useToolOverrides.ts`: metadata rebuild | Homepage resolved 411 unrelated tool keys and loaded the tool guide registry. Unrelated resource arrivals caused repeat model work. | Build only the current page using the same constructors; filter resource events; load guides only for tool metadata. Every scoped page is checked against full prerender output, including overrides. |
| P2 | `src/components/Loading.tsx`: lazy loading | Footer appeared at y756 in an 844px viewport then moved offscreen, contributing about 0.104 CLS. Held-chunk regression reproduced the geometry. | Reserve a viewport for loading, keeping footer outside the initial viewport. |
| P2 | `src/components/ToolHeader.tsx`: remote icon arrival | Native test measured tool input moving 251px when Iconify loaded. | Reserve responsive icon and bookmark geometry; main decoration is 96px on mobile and 250px on desktop. |
| P2 | `src/components/Navbar/index.tsx`, `App.tsx`: keyboard/theme | Mobile menu and theme lacked usable accessible button names. System listener overwrote an explicit theme choice. | Named buttons, keyboard activation and stable focus; listen to OS changes only in system mode. |
| P2 | `src/pages/tools/pdf/split-pdf/index.tsx`: clear/replace or invalid PDF | Correct output was exported, but Clear left the old download enabled. Pending reads/jobs could update obsolete state; parse errors escaped the generic caller. | Invalidate jobs, metadata and output on input changes/unmount; guard late commits and show safe error feedback. Validate actual selected PDF pages and invalid-file recovery. |
| P2 | `src/components/input/BaseFileInput.tsx`: PDF file input dependency | Full Lodash chunk (~27 KiB encoded) was loaded only for `isArray`. | Use equivalent native `Array.isArray`; no dependency added. |

Homepage did **not** load heavy codec/WASM/model runtimes in the baseline.
Large files in `dist` alone were not treated as initial transfer defects. Existing
lazy tool boundaries remain; the fix removes unnecessary startup work rather than
preloading every chunk or moving those codecs into the first interaction.

## Measurement protocol

Production `npm run build`, served by Vite preview on localhost, never the dev
server. Three fresh Chromium contexts per route in each phase; cache disabled,
service workers blocked, en-US, light, touch/mobile, 390x844, DPR 1. CDP CPU 4x,
150ms latency, 200,000 B/s download (1.6 Mbps), 93,750 B/s upload (750 kbps).
No concurrent local build/test during timing runs. Browser version and exact
profile are recorded in the comparison artifact.

Observe until controls are ready plus 2s. LCP and CLS are lab observations within
that window. CLS uses maximum session windows (1s gaps / 5s duration), recomputed
identically for both phases. Readiness is first visible search/textarea or attached
PDF file input, not a claim of TTI, field INP or responsiveness under all workloads.
Blocking time is sum of long-task duration above 50ms in this window, not Lighthouse
TBT. Native interaction tests separately exercise the controls and real PDF output.

`scripts/performance/cold-load.mjs` captures paints, heading/control arrival,
layout sources, long tasks, CDP request bytes/timings/initiator parent, resource
entries, errors and mobile overflow. `compare.mjs` rejects profile/browser mismatch
and incomplete/error samples. The committed compact artifact retains all 18 sample
summaries and a representative waterfall/dependency parent list per route/phase;
raw local observations/screenshots are in ignored `output/playwright/`.

Comparison: [all sample summaries and waterfalls](initial-load-performance.json).
Numbers below are medians of three samples, not statistically established field
improvements. Encoded CDP transfer includes protocol overhead, measured through the
observation window; it is not raw/minified bundle size.

| Route | LCP ms before / after | CLS before / after | Control ready ms before / after | JS KiB before / after | Requests before / after |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 3880 / 3808 | 0.10427 / 0.00130 | 3860 / 3777 | 244.3 / 225.3 | 36 / 33 |
| Reverse String | 4984 / 3924 | 0.20587 / 0.00788 | 4923 / 3881 | 291.6 / 262.3 | 47 / 34 |
| Split PDF | 5920 / 4692 | 0.26848 / 0.000008 | 5883 / 4656 | 481.0 / 425.4 | 39 / 25 |

| Route | FCP ms before / after | Heading ms before / after | Long tasks before / after | Blocking above 50ms before / after |
| --- | ---: | ---: | ---: | ---: |
| Home | 620 / 624 | 3857 / 3775 | 10 / 6 | 452 / 508ms |
| Reverse String | 672 / 616 | 4921 / 3880 | 13 / 5 | 838 / 387ms |
| Split PDF | 672 / 652 | 5882 / 4656 | 14 / 7 | 941 / 502ms |

CSS is unchanged at 3296 encoded bytes on all three routes. Baseline versus final
LCP ranges: home 3776-4120 / 3568-3992ms, Reverse 4580-5956 / 3904-3988ms,
PDF 5660-5940 / 4496-5384ms. Home's ranges overlap substantially; its small median
LCP change and increased blocking median do **not** establish a startup CPU win.
The robust home benefits here are layout stability, lower bytes and recovery.
Tool LCP/control readiness improve without requesting unrelated locale catalogs
or full English fallback. Cold PDF still loads its own parser before controls,
as before; processing cost was not hidden behind an added first-use action.

An intermediate iteration worsened home median LCP to 4220ms. That prompted
scoped SEO computation, conditional guide loading and loader geometry fixes;
it was not selected as the final success result. No retries, timeout increases,
assertion removals or timing thresholds were added to make browser CI pass.

## Waterfall and remaining costs

Document -> font/main styles and module preloads -> entry/bootstrap -> route
chunk, locale and optional SEO guide chunks -> rendering is visible in the
recorded parent/timing fields. Static modulepreload parents may be absent from
CDP stacks; this is a measured request dependency graph, not a complete static
import graph. Source inspection confirmed lazy imports in the tool registries;
no blanket manual vendor chunking or preload changes were applied.

The two render-blocking stylesheets and the self-hosted Quicksand variable TTF
remain (126,624 body bytes / 126,944 encoded transfer in this server). No font
conversion, glyph subset, license change or locale coverage reduction was made.
Remote Iconify requests remain decorative; their geometry no longer pushes the
input. Home still requests the tool catalogs used by its full search/list;
direct Reverse/PDF request only their relevant tool namespace, with the English
shell already bundled. Home avoids the ~25 KiB SEO guide registry; healthy tool
requests avoid the ~36 KiB full English fallback catalog. Main-thread work in
MUI/shared shell remains material under CPU 4x.

## Verification and limits

Production preview smoke passed direct URL, refresh, client home navigation,
back/forward, assets, mobile overflow and unknown-route noindex on all three
routes. Visual review at 390x844 confirmed useful home search and tool input
layouts. Actual Reverse output, selected PDF pages, clear/pending work, invalid
PDF recovery, keyboard theme/menu, delayed icons and failed chunk recovery are
covered by native browser tests. SEO checks include unchanged direct prerender
head, navigation identity and failed locale fallback. Unit parity covers every
page built with real overrides in English and non-English template modes.

One local WebKit full-suite run exported all three pages instead of selected
pages; three isolated traced runs and a subsequent eight-test WebKit suite passed.
The test now also asserts page-range value before and after upload, retaining the
exact decoded-output assertion. This did not reproduce as a confirmed application
defect; do not describe the diagnostic reruns as an automatic retry policy.
The final full startup/SEO suite with those assertions passed 39/39 across
Chromium, Firefox and WebKit, with retries disabled and traces enabled.

Local validation: production build/typecheck, 159 prerender route files plus
404, sitemap, Pages build (160 HTML files), production/Pages navigation smokes,
read-only ESLint on changed runtime/test files, text style, focused SEO/recovery
unit tests (21), metric aggregation (1), Pages preparation (1), security tests
(26) and dependency gate. No dependency/lockfile edits. Full CI at runtime revision
7523911 passed 159 unit files / 1550 tests, 8 startup browser tests and the existing
178 browser tests, production and Pages builds. Final evidence-only head must
also pass its own CI before merge; the final PR checks are authoritative.

Runtime-head CI evidence: [build/browser/Pages](https://github.com/nguyenan97/orvulix-web/actions/runs/39093587081),
[Gitleaks/dependency/CodeQL](https://github.com/nguyenan97/orvulix-web/actions/runs/39093587142).
CodeQL metadata summary still contains the same five high-scored findings,
with identical rules/paths, covered by the existing individual dispositions in
[SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md). The analysis job succeeding is
not a zero-finding or severity gate claim. The dependency audit retains its one
existing scoped exception; no scanner assertion, exception or protection changed.

Full-diff self-review checked requirements, import direction, unchanged lazy tool
registries, render/effect boundaries, async stale commits, recovery URL scope and
resource deadlines, output correctness, accessibility, metadata parity, dependency
impact and upstream integration locality. This is self-review, not an independent
approval. GitHub review/protection requirements continue to apply.

These are local lab results on Windows with emulated mobile/network/CPU. No
production field data, p75 Web Vitals, real low-end device CPU, mobile Safari
hardware, CDN compression/cache policy or production availability was measured.
FCP alone does not mean useful app content: headings/controls arrive much later.
The remaining 3.8-4.7s LCP under this profile is not a claim that every route now
meets a good real-world LCP target. No production deployment, active production
security scan, hosting/protection change or new dependency was performed.

## Follow-ups with explicit acceptance

| Owner | Non-blocking follow-up | Acceptance |
| --- | --- | --- |
| Project maintainer, next performance task | Further shell/typography CPU and transfer reduction | Preserve multilingual glyphs/licensing and existing search; run at least three identical cold samples per route, show useful-content and interaction improvement without CLS or first-use regression. Home LCP change in this task is inconclusive. |
| Project maintainer, release validation | Real-device / field performance | Separately authorized release; verify direct routes/assets/recovery on production and actual mobile devices, obtain representative field LCP/CLS/INP before claiming production thresholds. |
| Project maintainer, separate tool hardening | Large-file PDF/parser budgets across tools | Define input/time/memory limits and cancellation behavior, validate hostile/large fixtures and worker cleanup. This task invalidates stale results; it cannot cancel synchronous pdf-lib execution and does not audit all 137 tools. |
| Project maintainer, browser regression triage | Investigate if the single WebKit selected-range mismatch recurs | Keep input-state and exact PDF-page assertions, collect trace at failure and correct a demonstrated root cause. No suppressed failure, increased retries or waived output check. |
