# Bounded regex processing in list tools

Scope on this branch: all 11 list tools with regex split mode: Shuffle, Reverse,
Wrap, Unwrap, Rotate, Truncate, Group (`/list/chunk`), Sort, Find Unique,
Duplicate and Find Most Popular. Production changes only after an authorized
release to main.

## Reproduced problem and upstream review

On the pre-fix develop snapshot eb738a2, Chromium stopped responding to a page
heartbeat for at least 1.5 seconds after List Shuffle split 80 `a` characters
followed by `!` using `(a+)+$`. Issue #377 describes the same problem.
Upstream PRs #383, #389 and #366 were still open when checked October 12, 2026.
Pattern-length guards and heuristic checks cannot impose an execution deadline.

## Architecture

`src/workers/list-regex/BoundedListContent.tsx` wraps the existing ToolContent.
Each tool adds a wrapper import, operation identifier and result setter. The
transformation algorithms stay in their original services. Symbol mode calls
the original synchronous
compute; regex mode sends a serializable request to a disposable module worker.
Both compilation and the complete service operation happen in that worker.
No user-controlled RegExp is compiled on the UI thread in these 11 routes.

The runner enforces a 1-second deadline including startup and terminates on
success, errors, cancellation and unmount. Input/option changes abort the previous
request, clear output and prevent its result from replacing a newer result.
Cancel is explicit; the next edit starts fresh work. Worker startup failure is
shown as an error, with no synchronous regex fallback. An empty input clears
output without compiling its pattern. Processing messages use accessible status
and alert roles. Core list transformation semantics stay in the existing services,
including native captures, empty splits, filters, sorting, wrapping, padding,
parseInt truncate length, parseFloat copies and shuffle length.

## Limits and tradeoffs

Regex mode accepts 16 KiB UTF-8 input, 2 KiB pattern, 256-byte output separator
and a 512 KiB final output. A cheap preflight estimate also rejects obviously
expansive configurations; it may reject patterns whose actual output would be
smaller. Parenthesis counting deliberately overestimates possible captures.
Each extra text option is capped at 2 KiB. Preflight also estimates wrapper,
padding, counting and duplication expansion. Group size is restricted to an
integer from 1 to 4096; duplicate copies must be finite and at most 1000.
Those two service guards also apply to symbol mode to prevent non-progressing
loops or excessive allocation. Other symbol-mode transforms remain synchronous.
Direct service calls still do not have a regex deadline.

Workers do not provide a hard memory quota. Lookaround and overlapping captures
can allocate more than the preflight estimate, and the final byte cap is checked
after service execution. A timeout protects UI responsiveness but does not prove
an expression safe for production or enforce an exact wall-clock deadline in a
background tab. Large symbol-mode operations are outside this change.

No runtime dependency, API, storage or upload is added. The worker loads from the
same site's Vite-generated asset URL. Pages uses its existing repository prefix
and noindex; Netlify settings, routing and canonical URLs are unchanged.

## Remaining audit and sync hotspots

All 11 regex split routes use the same runner. The separate Regex Assistant
runner is unaffected. Sort and Find Most Popular import isNumber/itemCounter
from `pure-string.ts`, with original coercion, special-character mapping and
counting behavior. `src/utils/string.ts` re-exports those helpers for existing
callers; the worker never imports its registry/i18n runtime graph.

OperationOptions is a mapped discriminated union. `createRequest` projects and
validates known UI fields into operation-specific contracts, including the two
split-mode field names and Group's groupSeparator. Typed operation handlers
call each original service with its original parsing/argument order. Contract
errors clear busy state and never fall back to synchronous regex execution.

Sync hotspots: all 11 page imports/props, original service signatures, Group and
Duplicate guards, Sort/Popular imports, extracted helper re-exports in utils/string,
ToolContent's compute contract and `.github/workflows/pages-dev.yml`. Preserve
existing formatting and transformation semantics when resolving future changes.
No locale files change. `scripts/validate-list-worker.mjs` checks bundle inputs
and the emitted Vite worker for accidental browser application initialization.

## Verification

Unit tests exercise native split/capture behavior, shuffle membership/length,
limits, worker cleanup, stale results and unmount. Browser tests cover all 11
routes: valid/invalid patterns, empty input, real catastrophic input, a deliberately
stuck worker, timeout, cancel, editing back to symbol mode and route navigation.
Engines can bound backtracking internally; the real-input test accepts completion
or timeout while the deterministic stuck-worker test requires timeout and recovery.
Run browser deadline regressions serially (`--workers=1`) so malicious inputs
do not contend with unrelated worker startups on constrained CI executors.
The deadline/retry settings are not relaxed. Run production and Pages builds
to validate worker asset emission/base paths.
