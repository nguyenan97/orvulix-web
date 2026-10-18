# Task checkpoint: review-ghostscript-settlement

- Branch/base: feature/review-ghostscript-settlement / develop 3d3e9dee
- Phase: developing; PR pending; develop-merge; user requested R07 among all fixes.

Worker only handles success. WASM/network/import/runtime/message failure leaves
compression/protection pending forever; intermediate blob URLs and XHR have no
bounded failure ownership. Two actual service callers only.

AC: every worker startup/post/message/runtime failure, abort or 30s deadline
rejects once, terminates worker and removes listeners/timer; valid output still
compresses/encrypts correctly. No password/raw input logged. Clear/options/unmount
cancel obsolete worker jobs and prevent stale results/errors. Input max32 MiB,
output max64 MiB, deadline includes worker/asset startup; no hard CPU/heap claim.

Use transferable ArrayBuffers instead of input/output blob URLs and secondary XHR.
Keep Ghostscript args, remote WASM URL and application file naming/format semantics.
No dependency/hosting/network destination change, no offline claim.
Next: baseline failure reproduction, typed runner/worker errors, resource cleanup,
native blocked-WASM recovery and independently decoded encrypted/compressed PDFs.

Checkpoint: baseline worker-error regression returned hung; now 19 focused tests
pass for startup/import/network/header-size/empty-asset failures, parent error and
message paths, deadline/abort/transfer failure, byte budgets, successful transfer,
duplicate message cleanup and hook ownership. Privacy regression uses the actual
new message handler with network held; native codec tests independently verify it.

Native downloaded compression/protection PDFs decode through PDF.js with two pages,
retained text/geometry; wrong password rejected and correct password opens. HTTP503
WASM failures settle, Clear removes errors and fresh retry settles again. All three
engines pass 12/12, zero retries (r07-browser.json); real WASM CDN fetched for codec
tests. Pages CI includes deterministic blocked-network tests, not an offline claim.

Investigation: first codec success passed all engines, but Firefox failure cases
remained pending. Initial routing hypothesis was wrong: probe counted intercepted
requests and showed pending startup. Emscripten fallback was not settling promptly.
Explicit checked fetch supplies Module.wasmBinary before codec import, avoiding
fallback; same HTTP503 fixture now passes all engines without deadline/retry changes.
Temporary worker bootstrap/CSP probes were removed.

Build/typecheck (159 routes and 404), scoped read-only ESLint/style and audit pass.
Still needed: full local unit/security suites, full-diff review, integrate final
develop after PDF lifecycle, exact-head CI then authorized merge/cleanup.
R12 PR50 merged at f6fe6902. Next save this prepared slice and deliver PDF lifecycle.
