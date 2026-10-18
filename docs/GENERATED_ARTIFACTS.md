# Checked-in generated artifacts

`src/lib/ghostscript/gs-worker.js` is inherited Emscripten JavaScript output,
identified by its shell/runtime sections and generated globals. History includes
`958e47bf` (compress PDF) and `d9e694cb` (lib refactor). This lint cleanup does not
establish the original Ghostscript source version or regeneration recipe.

Canonical SHA-256 (UTF-8 with LF line endings):
`a4e4eedceae126e551990884185fb4a46ad21456126319875223917e88a928f1`.
Its content is unchanged in this task; existing licensing/attribution is retained.

Only this exact file is excluded from ESLint. Generated runtime globals triggered
136 inherited diagnostics, which are not 136 independently verified defects.
Hand-editing or reformatting it to satisfy application lint risks breaking codec
initialization. The background-worker and worker-init adapters remain fully linted.
Type/build and actual Ghostscript compression/encryption browser tests still cover
integration; the same remote WASM asset remains a runtime dependency.

Owner: nguyenan97. Before updating the artifact, establish source/build/license
provenance and regenerate through the upstream toolchain in a scoped task. Review
the canonical hash/diff, adapter protocol, network behavior and native PDF outputs,
then update this record. Do not extend this ignore to hand-written application code
or treat the hash as a security audit of the codec.
