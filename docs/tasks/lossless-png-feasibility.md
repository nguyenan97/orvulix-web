# Task checkpoint: lossless-png-feasibility

- Updated: 2026-10-21 Asia/Bangkok
- Branch/base: feature/lossless-png-feasibility / develop acee6ace
- PR: not opened
- Phase: scoped
- Delivery mode: develop-merge
- Authorization: user requests continuing project task notes and executing a prompt
  from develop; selected next ordered backlog feasibility step after delivered
  text/Docker/checksum/transfer/subnet and GIF ordering tasks.
- Last verified tree: develop acee6ace; research files uncommitted.

## Scope and acceptance

[Execution prompt and A1-A4](../LOSSLESS_PNG_FEASIBILITY.md). Research spike only:
measure installed compressor/native alternatives and decide next implementation
contract. No runtime/UI/registry/SEO/dependency/hosting change. Risk: local benchmark
worker/stream resource ownership, trusted synthetic PNG assembly, honest pixel and
metadata evidence. No arbitrary file input, uploads, storage or remote code.

## Completed and pending

Scanned latest develop notes and GitHub: no open PR; PR61 ordering already merged.
Upstream issue359 remains open,295 closed,461 merged; PR461 uses quantization,
not strict lossless sample preservation. Installed library calls UPNG.encode with
4096*quality. Existing PR24 dimension/non-inflation contract remains untouched.
Local dependencies need npm ci (initial npm run prepare could not find husky).
Pending harness, runs, results, review, local checks and exact-head CI delivery.

## Validation and review

No benchmark results claimed yet. No independent approval claimed.

## Resume point

Complete harness and run three native engines; reconcile measurements and decision,
then local validation/review and one PR into develop. npm ci running at initial
checkpoint; no task-owned app server/browser left intentionally running.
