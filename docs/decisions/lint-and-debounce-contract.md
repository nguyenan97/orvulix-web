# Read-only lint and debounce ownership

Status: accepted for R14.

Lint is a diagnostic gate; mutation requires the explicit lint:fix command. Preserve
rules and max-warnings=0. Generated Emscripten gs-worker.js is a single documented
artifact exception, not an application source baseline. Type/build/codec tests
continue to cover it; hand-rewriting generated globals to appease ESLint is rejected.

Existing routes wrap debounce(compute) in useCallback with empty dependencies,
leaving stale callbacks and unowned queued work. Reuse the existing useDebounce
hook with stable debounced identity per delay, an updated callback ref and cleanup
cancelling queued calls on delay change/unmount. Preserve lodash's return/flush/
cancel semantics; do not add a new async task framework or claim in-flight abort.

Adding compute dependencies was simpler but recreates inline callbacks each render
and can retrigger ToolContent effects indefinitely. A lint suppression was rejected
because the closure/lifetime issue is real. Migrate only existing debounce users
and remove now-unused imports; rollback restores those adapters and hook together.
Upstream hotspots: hook and inherited per-tool debounce declarations, no route
layout/options/codec/dependency changes.
