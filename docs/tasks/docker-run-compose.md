# Task checkpoint: docker-run-compose

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/docker-run-compose / develop e61aac398e51cfb2bd3ef7c63dbfd5973d83e4d8
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge
- Authorization: user requests plan, prompt and execution of the next task. One
  backlog item only; main/production and subsequent features excluded.
- Last verified tree: develop e61aac39 plus uncommitted converter/parser/tests,
  thin integration/metadata, scoped converter audience fix and task documents.

## Scope and acceptance

See ../DOCKER_RUN_COMPOSE.md for authored plan, execution prompt and precise
supported/unsupported behavior. Browser-local one-command converter with bounded
whitelist parsing, literal-safe Compose YAML and current-result copy/download.

## Completed and pending

Read repo instructions/applied engineering practices, backlog and current source.
Upstream issue379 remains open, comments reference Composerize. No existing
converter found. Docker/Compose official documentation and Context7 consulted.
Dependency decision: no new runtime dependency, bounded lexer/whitelist/serializer.
Docker Compose v5.1.4 is available for an independent config-only output oracle.
Bounded lexer, whitelist mapper, Compose-safe YAML and explicit current-result UI
implemented. Unknown options block exports. Registry/English/SEO/roadmap and browser
CI integration added. Explicit converter audiences now override only that category's
inherited media fallback, preserving all previous media-converter membership.

Focused feature tests: 81 passed before final parser review, then focused feature
and registry checks passed (91). Review added default-network alias, anonymous
read-only volumes, short equals values and rejection of invalid long short-alias
flags/noncanonical IPv4. Final focused/full checks remain pending for these edits.
Initial browser run passed native copy/download and full mapping, then hit an
ambiguous port-error locator matching SEO copy; scoped locator to alert and rerun.
Initial full run started before audience correction completed, failed its new
audience assertion; it is not passing evidence. Fresh focused audience check passed.

Independent Docker Compose v5.1.4 config oracle: 3 fixtures pass for minimal YAML,
full options/argv/Unicode/dollars and reserved names/escapes. No container executed.
CLI re-escapes dollar signs when presenting config; verified pinned primary source,
decoded only that presentation layer, with hostile host values to catch accidental
interpolation. Initial oracle expectation missed this CLI behavior; corrected.

Initial production build/typecheck/SEO/sitemap passed: 159 indexable routes / 137
tools / 14 categories. Fresh final-source build is running. Security harness 26
pass and dependency audit unchanged at 15 findings / 6 advisories / existing braces
exception. No dependency/security policy change. All browser/full/Pages/review/CI
gates still required. No deadline/retry or security gate increase.

## Validation and review

Use literal expected fixtures and standards/requirements full-diff review. Runtime
processing is bounded synchronous conversion, not a hard CPU/heap quota. POSIX text
subset and Linux-container assumptions are explicit; unknown shell/Docker syntax
blocks output. Existing security findings/exceptions remain outside this task.

## Resume point

Finish frozen-source tests/build/native browser validation; open one draft PR into
develop and update it, then Pages smoke/visual QA/full review/exact-head CI/merge
and branch cleanup. Dev watcher PID29800 identity verified and stopped; no app dev
server remains. Prior browser preview exited. Build session44421 is running.
Owned scratch under work/: docker-compose-oracle.cjs, docker-convert.cjs,
docker-minimal.yaml, docker-literals.yaml, docker-reserved-and-escapes.yaml and
docker-native.json. Preserve unrelated files; inspect actual Git/PR state on resume.
