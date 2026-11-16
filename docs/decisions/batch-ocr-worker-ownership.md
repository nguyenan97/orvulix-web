# Batch OCR worker ownership

Status: accepted for the bounded Batch OCR development MVP, 2026-10-21.
Owner: Orvulix maintainers.

The installed Tesseract.js createWorker promise exposes the native worker after
initialization, too late for reliable cancellation while loading core/models.
Keeping that helper with late cleanup is simpler but cannot immediately stop a
stalled startup. A nested wrapper worker or global Worker patch adds hidden
ownership and application-wide coupling.

A feature-local adapter owns the installed classic worker immediately and sends
its load/loadLanguage/initialize/recognize protocol. Native terminate is used on
cancel, errors and completion; a separate disposable ZIP worker owns export.
The protocol is internal and version-sensitive. Installed worker/core assets are
served through Vite URL imports, preserving Pages prefixes and upstream licenses.
Pinned English/Vietnamese public models download only on explicit Run. Disable
IndexedDB model caching, disclose CDN IP exposure and retain local user data.
No new dependencies, provider credentials, backend or hosting settings are added.

Changes are isolated to src/features/batch-ocr and thin tool/SEO/roadmap adapters.
The old single-image OCR service is untouched. Updates to Tesseract must run the
real model/browser artifact and startup-cancellation tests; helper mocks alone do
not establish protocol compatibility. See [contract](../BATCH_OCR.md) for bounds.
Rollback removes the batch route and metadata/module together, leaving old OCR.
