# Batch OCR

## Execution prompt

Continue the ordered feature backlog from updated `develop` on `feature/batch-ocr`.
Implement one bounded, local Batch OCR tool, with language selection before any
processing, English and Vietnamese, sequential input order, progress, cancellation,
and TXT/ZIP downloads. Reuse installed Tesseract.js and JSZip. Isolate the feature
and keep inherited single-image OCR unchanged. Follow AGENTS.md and the SDLC loop:
local dev, meaningful regression and native-browser artifact checks, production
and Pages builds, full diff/security review, exact-head CI, one PR into develop,
then authorized merge and safe branch cleanup. Do not release production.

## Contract and acceptance

Before: the inherited single-image OCR has no batch output or Vietnamese selector.
After: `/image-generic/batch-ocr` processes an explicitly selected language only
when Run OCR is pressed. Selection order is output order, displayed as numbered
files. Replace selection to change order; no implicit sorting. A run is atomic:
errors/cancel discard partial output, and a subsequent run starts fresh.

- AC1: two real images produce ordered text and numbered TXT entries in a ZIP.
- AC2: English, Vietnamese and their combination are explicit supported choices;
  no model request occurs before Run. Real Vietnamese traineddata must be verified.
- AC3: Cancel, replacement, language change, Clear and unmount terminate the owned
  worker, including startup/model download, reject pending work and prevent stale output.
- AC4: reject empty, oversized, unsupported, corrupt or excessive-dimension inputs;
  show an actionable error and allow recovery. Batch maximum 10 PNG/JPEG files,
  4 MiB each, 24 MiB combined, 4096 per side and 4 million pixels each. Admit
  headers before codec execution. PNGs have at most 512 chunks; strip ancillary
  metadata except transparency from a bounded working copy before decoding, so
  compressed ICC/text metadata cannot expand inside the codec. Original files stay
  unchanged. Reject duplicate headers and unsupported critical chunks. No image previews or main-thread pixel decode.
- AC5: progress names setup/current file; 180-second total deadline; maximum
  100,000 text characters per image and 500,000 total. Empty OCR is a valid result
  with a visible warning. Downloads belong only to the completed current run.
- AC6: route metadata, roadmap and Pages prefix/noindex stay accurate.

PDF output, automatic language detection, layout fidelity, drag-reordering and
additional languages are deferred. Recognition accuracy varies: proofread output.
Limits bound admitted work, not a hard browser/WASM heap quota.

See [worker ownership decision](decisions/batch-ocr-worker-ownership.md).

## Acceptance examples and evidence boundaries

| IDs | Given / When / Then | Evidence |
| --- | --- | --- |
| AC1/AC2 | Given the known Vietnamese PNG and English JPEG in that order, when combined-language Run completes, then accented fixture text and ordered TXT/ZIP entries match. | batch.e2e.spec.ts, genuine models; Python zipfile independently decodes ZIP. |
| AC3 | Given startup/model download in progress, when Cancel is pressed, then the native worker terminates and no partial output appears; a fresh run succeeds. | engine/UI/ZIP lifecycle unit tests plus native startup cancellation/recovery. |
| AC4/AC5 | Given oversized geometry, corrupt pixels or network failure, when Run fails, then no download survives and valid retry works. Given a run exceeding its deadline, then abort releases processing. | policy/run/UI tests; native error/retry, deadline via fake clock. |
| AC6 | Given a Pages build under /orvulix-web/, when the route loads and OCR runs, then prefixed worker/core/export assets work and route metadata remains noindex. | Pages build validator and the same native browser spec with base prefix. |

Focused command: `npx vitest run src/features/batch-ocr src/seo/roadmap.test.ts src/seo/overrides.test.ts`.
Native command after build: `PLAYWRIGHT_USE_EXISTING_BUILD=true npx playwright test src/features/batch-ocr/batch.e2e.spec.ts --workers=1`.
Unit worker mocks establish lifecycle rules, not codec fidelity or CDN availability.
The native tests use real model requests and downloads; cloud environments must
trust their configured proxy CA without disabling TLS verification.

## Data flow and decision

File bytes -> bounded PNG/JPEG header admission and PNG metadata removal -> disposable Tesseract worker ->
plain text -> bounded JSZip worker -> Blob downloads. React renders text as text.
Distribution license texts and worker notices are preserved in
`public/licenses/batch-ocr.txt`.

No user image/text upload, telemetry or application persistence is added. Browser
HTTP cache may retain public assets. Tesseract IndexedDB model caching is disabled.

Use the installed Apache-2.0 Tesseract.js 6.0.1 classic worker and bundled
non-SIMD LSTM core (6.0.0) via Vite asset URLs. Core contains its WASM bytes.
Public model package metadata declares MIT. Models are lazily downloaded from pinned jsDelivr @tesseract.js-data 1.0.0 paths
(4.0.0_best_int) only on Run; disclose third-party network/IP exposure and offline
failure. The installed JSZip remains MIT/GPL dual licensed; no dependencies change.

The feature adapter speaks the installed worker's small load/loadLanguage/
initialize/recognize protocol directly. Unlike createWorker's startup promise,
this gives immediate ownership of the real native worker before core/model load,
so Cancel can terminate startup without a hidden nested worker or global patch.
This is a version-sensitive internal protocol: keep it isolated in engine.ts and
verify actual OCR in native browsers when updating Tesseract. The status-quo
createWorker helper was rejected because it exposes termination only after startup.
Rollback removes the separate route/module and its metadata; old OCR is untouched.
Owner: Orvulix maintainers. Accepted for this bounded development scope, 2026-10-21.
