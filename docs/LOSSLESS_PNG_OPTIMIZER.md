# Lossless PNG recompression MVP

## Execution prompt

Continue PR62's feasibility decision from updated develop. Implement a separate
Lossless PNG Optimizer at /png/lossless-png using native deflate streams in a
disposable worker. Preserve exact filtered samples and accepted non-IDAT chunks;
retain original bytes whenever the candidate is not smaller. Support static PNG
legal color/depth combinations and Adam7, with strict core structure/CRC checks,
bounded expansion and filter/palette validation. Preserve common metadata as
opaque bytes; reject unsupported unsafe-to-copy chunks and APNG. Do not decode
or preview user images before admission. Expose explicit Optimize, Cancel, Clear,
current-result download, errors and recovery, with no upload or persistence.
Use existing dependencies, isolated feature files and small registry/SEO/English
copy integrations. Validate parser/resource boundaries, real output samples and
metadata, worker cancellation/stale ownership, keyboard/mobile and Pages assets.
Review and iterate, pass exact-head CI, merge one PR into develop and clean up
only its completed branch. No production release or next backlog item.

## Contract and acceptance

This is best-effort IDAT recompression, not palette reduction or an oxipng
replacement. No new package or codec binary. Input is one static PNG up to 4 MiB,
4096 pixels per side, 4 million pixels, 512 chunks and 32 MiB filtered bytes.
The 15-second worker lifetime covers file reading, parsing and compression.
These are admission/allocation limits, not a strict total heap quota. Metadata is
preserved without decompression or display; this is not a full metadata/ICC/EXIF
validator or general image-decoder security certification.

| ID | Given/when/then and evidence |
| --- | --- |
| A1 | Supported PNG produces exact samples/non-IDAT chunks and no larger output; parser/engine tests and real downloads across three engines |
| A2 | Invalid CRC/header/chunk order/animation/expansion/filter/palette data is rejected, then valid input recovers; targeted tests/native worker |
| A3 | Replacement, Cancel, Clear and unmount terminate the owned worker, hide stale download and ignore queued success/error; runner/UI tests and native browser |
| A4 | Native file picker, full filename and status/error/download work on keyboard/mobile without pre-admission decode, upload or persistence; browser checks |
| A5 | New lazy route, truthful copy/SEO and Pages worker prefix/noindex validate; production/Pages builds and smoke |

Data flow: local File -> size gate -> worker File.arrayBuffer -> strict core PNG
parser -> bounded native inflate -> scanline validation -> bounded native deflate
-> CRC-correct IDAT replacement or original -> transferred buffer -> PNG Blob
download. Filenames render as React text. No preview, HTML sink, network content
request, server, authentication or storage. Existing app/icon assets may download.

Known core chunks are IHDR/PLTE/IDAT/IEND/tRNS. Common metadata gAMA, cHRM, sRGB,
iCCP, pHYs, tEXt, zTXt, iTXt, eXIf and tIME is retained verbatim; unknown ancillary
safe-to-copy chunks are retained. Other unsafe-to-copy chunks fail explicitly.
No silent stripping. Parser validates core semantics and metadata placement/basic
shape where needed; opaque metadata contents are outside this tool's processing.

Rollback removes the isolated route/registry/SEO/copy adapters and feature module;
existing palette compressor remains independent. No data migration. Follow-up
owner: Orvulix maintainer, for improved filtering/WASM only after measured need.
