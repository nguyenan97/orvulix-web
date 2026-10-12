# Bounded regex processing in list tools

Scope on this branch: `/list/shuffle` and `/list/reverse`. Other list tools are
not covered. Production changes only after an authorized release to main.

## Reproduced problem and upstream review

On the pre-fix develop snapshot eb738a2, Chromium stopped responding to a page
heartbeat for at least 1.5 seconds after List Shuffle split 80 `a` characters
followed by `!` using `(a+)+$`. Issue #377 describes the same problem.
Upstream PRs #383, #389 and #366 were still open when checked October 12, 2026.
Pattern-length guards and heuristic checks cannot impose an execution deadline.

## Architecture

`src/workers/list-regex/BoundedListContent.tsx` wraps the existing ToolContent.
Each tool adds a wrapper import, operation identifier and result setter. The
original services are unchanged. Symbol mode calls the original synchronous
compute; regex mode sends a serializable request to a disposable module worker.
Both compilation and the complete service operation happen in that worker.
No user-controlled RegExp is compiled on the UI thread in these two routes.

The runner enforces a 1-second deadline including startup and terminates on
success, errors, cancellation and unmount. Input/option changes abort the previous
request, clear output and prevent its result from replacing a newer result.
Cancel is explicit; the next edit starts fresh work. Worker startup failure is
shown as an error, with no synchronous regex fallback. An empty input clears
output without compiling its pattern. Processing messages use accessible status
and alert roles. Core list transformation semantics stay in the existing services,
including native captures, empty splits, reverse filtering and shuffle length.

## Limits and tradeoffs

Regex mode accepts 16 KiB UTF-8 input, 2 KiB pattern, 256-byte output separator
and a 512 KiB final output. A cheap preflight estimate also rejects obviously
expansive configurations; it may reject patterns whose actual output would be
smaller. Parenthesis counting deliberately overestimates possible captures.
These are limits on the new regex path; symbol mode retains its existing behavior.
The original services are not hardened for direct calls by other code.

Workers do not provide a hard memory quota. Lookaround and overlapping captures
can allocate more than the preflight estimate, and the final byte cap is checked
after service execution. A timeout protects UI responsiveness but does not prove
an expression safe for production or enforce an exact wall-clock deadline in a
background tab. Large symbol-mode operations are outside this change.

No runtime dependency, API, storage or upload is added. The worker loads from the
same site's Vite-generated asset URL. Pages uses its existing repository prefix
and noindex; Netlify settings, routing and canonical URLs are unchanged.

## Remaining audit and sync hotspots

The same UI-thread regex pattern remains in Wrap, Unwrap, Rotate, Truncate,
Group, Sort, Find Unique, Duplicate and Find Most Popular. Some services import
`src/utils/string.ts`, which imports the registry/i18n; do not pull that runtime
graph into a worker without auditing its environment and bundle. Add isolated
operation adapters or extract pure helpers in a follow-up. Do not mark the entire
list-tool family as fixed because these two routes are covered.

Sync hotspots: the two page imports/props, their existing service signatures,
ToolContent's compute contract, and `.github/workflows/pages-dev.yml`.
The new wrapper infers ToolContent props instead of duplicating its interface.
Preserve service semantics when resolving future changes. No locale files change.

## Verification

Unit tests exercise native split/capture behavior, shuffle membership/length,
limits, worker cleanup, stale results and unmount. Browser tests cover both
routes: valid/invalid patterns, empty input, real catastrophic input, a deliberately
stuck worker, timeout, cancel, editing back to symbol mode and route navigation.
Engines can bound backtracking internally; the real-input test accepts completion
or timeout while the deterministic stuck-worker test requires timeout and recovery.
Run production and Pages builds to validate worker asset emission/base paths.
