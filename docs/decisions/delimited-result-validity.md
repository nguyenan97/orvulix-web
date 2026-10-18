# Delimited result validity

Status: accepted for review remediation R04.

CSV and TSV share a pure bounded parser in `features/delimited-json`. Their result
component derives output and errors from current Formik options and input. No
previous successful output can survive an invalid record or Clear.

`ToolTextResult` gains an optional `disabled` flag, default false, matching the
existing `ToolCodeResult` export contract. Both handlers and footer honor it.
Wrapping buttons with CSS was a simpler alternative but would leave keyboard and
programmatic handlers active. Exporting an error as JSON was rejected because it
misrepresents conversion success.

Existing consumers retain their behavior. Migration touches only CSV/TSV routes;
rollback restores their adapters and removes the opt-in flag. Upstream sync
hotspots are the two route result slots and the small shared result API addition.
No dependency, storage, network or hosting change is introduced.
