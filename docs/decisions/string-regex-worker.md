# String tool regex isolation

Status: accepted for R08.

Three string routes share one typed worker boundary and current-result component.
Pure services retain their API and run inside that worker. The UI only performs
static size/shape checks; it never compiles a user pattern. No synchronous fallback
is provided when workers are unavailable. Current input/options own result validity.

A regex blacklist was simpler but cannot establish a runtime bound. Reusing the
list worker would couple unrelated operations/contracts and would not support
replacement semantics. A small dedicated worker with conservative preflight and
existing service calls preserves locality. Native replacement semantics are kept,
including capture and prefix/suffix substitutions, by budgeting potential expansion.

Rollback restores the three route callbacks and removes this feature together,
losing isolation. Upstream hotspots: route result slots and iterative palindrome
helper. Existing list/assistant workers are unchanged. No dependency, storage,
network or hosting changes.
