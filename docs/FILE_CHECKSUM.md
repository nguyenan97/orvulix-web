# File Checksum Calculator

## Execution prompt

Implement a File Checksum Calculator in Orvulix's existing React/TypeScript SPA.
Support one local file, SHA-256/SHA-512, case-insensitive expected hexadecimal
checksum comparison and native copy with manual-copy guidance. Admit at most
64 MiB before reading. Run file reading and Web Crypto hashing in a dedicated
worker with a 30-second deadline and termination on Cancel, input/algorithm
changes and unmount. Only the current run may publish a result or notification.
Reject malformed expected values explicitly. No uploads, automatic persistence,
new dependencies, MD5, encryption or multi-file processing. Add tool discovery,
English metadata, SEO and accurate roadmap status. Validate known vectors,
binary/empty files, rejection/recovery, lifecycle ownership and real browser
behavior, including Pages prefix/noindex. Review the complete diff, pass current
CI, merge the task PR into develop and clean up its branch.

## Contracts and design

- Route: `/string/file-checksum`. Feature code owns admission/comparison, worker
  orchestration and UI; inherited integrations are registry/meta/English locale
  and SEO only. No changes to other file import consumers.
- A file's bytes, not its name or text decoding, determine the digest. Output is
  lowercase hex, 64 or 128 characters. Empty files are valid.
- Expected value is optional; surrounding whitespace is trimmed. Wrong length
  or non-hex is invalid, distinct from a valid mismatch. Algorithm changes clear
  the computed result and revalidate the expected value.
- One worker per explicit Calculate. A File is structured-cloned to the worker,
  which checks size before arrayBuffer(), then calls crypto.subtle.digest.
  Whole-buffer hashing was chosen over a new streaming library to avoid a new
  dependency. Web Crypto is not streaming; 64 MiB bounds source bytes, not total
  browser heap. HTTPS or localhost and Web Crypto are required.
- Worker termination cancels application ownership and worker execution; native
  crypto cancellation/reclamation timing belongs to the browser. No progress
  percentage is invented for digest(). A 30-second main-thread deadline covers
  worker startup, file read and hashing, subject to browser event-loop scheduling.
- Worker errors are fixed messages, never file bytes. All messages are checked
  before publication. Clear/change/cancel/unmount discard earlier results.
- No fetch, upload, storage, object URL, external codec or model in this feature.
  App assets can still load over the network. Clipboard uses the existing helper.
  This tool compares integrity against a supplied value; it does not establish
  the authenticity of that value or encrypt files.

## Acceptance and validation

| ID | Given/When/Then | Evidence |
| --- | --- | --- |
| A1 | Empty, abc and binary files produce known SHA digests | Node crypto vector tests plus actual native worker browser flow |
| A2 | Uppercase/trimmed expected hex matches; wrong/invalid hex is distinguished | Pure comparison tests and UI/browser checks |
| A3 | Files over 64 MiB reject before read; zero and exact boundary admit | Admission tests and UI rejection/recovery |
| A4 | Cancel, Clear, file/algorithm edits or unmount invalidate old output | Runner fake-worker tests, DOM deferred-run tests, native cancel/recovery |
| A5 | Worker failures, timeout, unavailable crypto and clipboard denial recover | Boundary tests and browser controlled-failure cases |
| A6 | Tool is discoverable; production SEO and Pages prefix/noindex remain valid | Registry tests, build validators, Pages browser smoke |

Pure tests do not prove browser worker/native clipboard behavior. Browser checks
use fixtures and scoped controlled failures; they do not audit unrelated tools.
Security controls: file budget, worker deadline/cleanup, React text rendering,
no data network/persistence sink; existing SCA/SAST/secrets CI remains applicable.
Auth/backend/HTML sanitization/container controls are N/A to this byte-hash tool.

## Sources and upstream

Reviewed 2026-10-19: upstream issue #114 is open; the current open PR list contains
no checksum feature. This is an Orvulix MVP, not an upstream acceptance claim.
- https://github.com/iib0011/omni-tools/issues/114
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

## Rollback and follow-up

Remove the feature route/meta/registry/SEO entry and isolated feature module.
No persisted data or schema migration. Larger streaming files require a separate
dependency/performance review. Owner: Orvulix maintainer. Production release is
separate from develop delivery.
