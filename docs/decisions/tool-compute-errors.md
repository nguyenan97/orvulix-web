# Tool compute error ownership

Status: accepted for review R12.

ToolContent invokes inherited callbacks on input/options changes. It now observes
their returned promise as well as synchronous throws. Callback return type is
unknown because existing synchronous callbacks may return ignored values; a
void-only contract previously allowed these and concealed promise rejection.

Each effect owns error reporting until its cleanup. Rejected obsolete work remains
consumed, but only the current input/options may report a snackbar. This does not
cancel processing or prevent a callback from writing its own stale result; tool
services still own that lifecycle. Raw non-Error rejections receive a generic
message instead of being logged.

A bare Promise.catch was simpler but would surface stale errors after edits or
navigation. Adding compute to the main effect dependencies would loop for inline
callbacks that update local state. A small preceding effect updates a callback ref
without changing existing input/options triggers.

No callers need migration. Rollback restores the old effect, losing async failure
handling. Upstream hotspot is ToolContent's listener, without a global job runtime,
dependency or hosting change.
