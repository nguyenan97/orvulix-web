# Task checkpoint: duplicate-lines-preserve

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/duplicate-lines-preserve / develop at 2330dd676396d384673225dc42bd155dafb43fcc
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge
- Authorization: fix the confirmed duplicate-lines defects thoroughly; standing
  workflow permits this task's develop merge after gates. No main/release or new
  backlog feature.
- Last verified tree: base 2330dd67 plus uncommitted service/tests, roadmap/backlog,
  focused browser CI command and this checkpoint.

## Scope and acceptance

Preserve blank lines without restoring removed duplicates or discarding trim/sort.
Check all 36 combinations of mode, newline policy, trim and sort with literal
expected output; CRLF/CR, Unicode, blank-only and repeated-call cases. Sorting
applies to retained lines, including preserved blank lines. Blank lines interrupt
consecutive runs unless the delete policy removes them first. Normalize line
separators to LF; trim precedes duplicate comparison. Existing whitespace-only
blank classification and case-sensitive comparisons remain.

Validate real UI option changes and copy/download outputs on three browsers.
No Workflow Builder, dependency migration, global editor rewrite or production
settings changes. Prior JSON PR38 is a separate completed scope, not proof this
tool was correct. Correct the stale public JSON roadmap summary alongside this
follow-through if no unrelated integration is needed.

## Completed and pending

- Confirmed preserve restores duplicates, loses trimmed lines and ignores sort.
- Existing preserve test uses substring assertions and misses these defects.
  Git history traces the unchanged service/test to 71e052ab (original tool);
  this is not a regression introduced by the prior JSON PR38.
- Replaced the weak preserve assertion; added exact literal outputs for all 36
  option combinations and line-ending/Unicode/blank/consecutive/repeated-call cases.
- Red: 18 failures / 58 tests on the old service. Green: 58 / 58 after preserving
  blanks during filtering and removing raw-input reconstruction.
- Added two native-browser flows for option transitions, clearing/replacing input,
  actual clipboard writes and downloaded bytes; included the spec in existing CI.
- Reconciled existing PR37/38 delivery in public roadmap and backlog; no planned
  feature was reclassified as delivered.
- Built production browser checks: 9 / 9 passed on Chromium, Firefox and WebKit,
  retries 0 (two duplicate-lines flows plus static/React roadmap per engine).
- Pending: Pages artifact smoke, exact-head CI, merge and cleanup.

## Validation and review

- Full Vitest: 149 files, 1,394 tests passed. Existing locale HTTP requests to
  localhost:3000 emitted ECONNREFUSED stderr; runner exit 0 and all assertions pass.
- Focused service + roadmap: 61 tests passed; changed TypeScript ESLint passed.
- Security audit: 15 package findings / 6 advisories; no unaccepted high/critical,
  existing braces tooling exception unchanged (expires 2026-11-13).
- Security harness: 26 tests passed. Text-style check passed (rerun after staging
  new files). Production build/typecheck passed: 157 routes + 404, 157 sitemap
  URLs (150 lastmod). Pages prepare harness: 1 test passed.
- Standards self-review: focused pure-service diff, Set/Map remain local per call,
  no input execution/new dependencies, no shared UI or production settings edits.
  Removed raw-input reconstruction and its repeated membership scans. Existing
  sorting remains UTF-16 ordering; no performance quota or locale sorting promised.
- Requirements self-review: literal option matrix plus mode transitions and real
  clipboard/download bytes cover all reported defects. Exact-output expectations
  replace the missed invariant. No task-blocking finding remains in reviewed code;
  this is self-review, not independent approval.

## Resume point

Finish Pages build (session 19582), smoke prefix/noindex, commit and draft PR.
Owned Vite dev session 30126 (port 5173). Production browser server exited with
session 32588; no persistent production preview requested.
