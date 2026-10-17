# Task checkpoint: JSON foundation hardening

- Updated: 2026-10-17 Asia/Bangkok
- Branch / base: feature/json-foundation-hardening / develop c94aaf26
- PR: not opened
- Phase: validating
- Delivery mode: develop-merge
- User constraint/authorization: verify and fix the previously discussed foundation issues before new features; no main merge or production deploy.
- Last verified base: c94aaf26. Runtime/tests/docs changes are uncommitted; installed Node 20.20.0 dependencies and activated Husky.

## Scope and acceptance

Fix JSON Sort current-result ownership: empty/invalid input and failed options
must clear output, disable export and show current actionable errors. Recovery,
JSON/JSONL output, native copy/download, shallow sorting and own keys remain.
Bound Prettify/Minify/Sort input, nesting, lexical values and output before publishing;
bound shared text/code file imports before FileReader startup and after decoding.
Keep parser semantics for accepted inputs. Use explicit size errors, no truncation.
Check current security audit, braces release/advisory and dependency reachability;
do not hide findings, extend exceptions or migrate CSS just to make an audit green.

Non-goals: Text Workflow Builder or other new features; generic tool rewrite;
main reconciliation/release, production configuration, paid APIs. A file budget
does not bound arbitrary pasted input in unrelated tools. Bounded synchronous
processing is not worker isolation or a strict wall-clock deadline.

## Completed and pending

Remote develop matches local base, no open PR. npm reports braces latest 3.0.3;
GitHub GHSA-vfj7-8cjw-p6xm still lists no patched version. Existing exception
expires 2026-11-13 and must not be silently removed or extended.
Initial security:check failed before audit output on Windows; investigate native
npm child-process startup separately from registry/advisory status.

## Validation and review

- Original source component tests: 6 failed / 14 passed (2 Sort, 4 file budgets); original evaluator tests: 4 resource regressions failed. Early missing-dependency/native-binding startup errors were not behavioral evidence.
- After fixes, focused unit tests: 72 passed in 9 files; typecheck passed. Changed TypeScript ESLint passed (15 files before SEO portability corrections). An overly broad lint command found an unchanged no-this-alias violation in testing/defer-reads.ts; that file was not edited.
- Security tests: 26 passed; fresh gate: 15 package findings / 6 advisories, 0 unaccepted high/critical, 1 unchanged temporary exception. No dependency or policy migration.
- Pages preparation fixture and text style/whitespace passed. Native browsers downloaded. Dev server started on 127.0.0.1:5173 (owned session 51514).
- Initial full Windows suite FAILED: 144 files passed / 5 failed, 1332 tests passed / 2 failed. Three SEO suites failed import with SyntaxError and two assertions assumed POSIX paths. Those files matched base. Path assertions and the sitemap validator are now portable; Node-only SEO scripts use documented Vitest server.deps.external to retain native Node import semantics. All 24 tests in the five affected SEO files passed. Removing hashbang/TLA and LF-only experiments did not solve the runner boundary and were reverted. That failed run is not green.
- Vite/prerender completed; the first production command failed at sitemap filesystem/URL separator comparison. Corrected validator and dist validation both pass (157 routes, 150 lastmod, 404); complete build rerun remains pending.
- First native run stopped after two Windows CRLF read-back assertion failures; application write arguments passed. Expected read-back now follows Windows CRLF while write arguments/download bytes remain exact. Second native run found a fixture selecting the language combobox; snapshot showed English language options. Locator now selects the live Sort mode by its selected text, excluding examples. No timeout/retry/assertion weakening.
- Pages build was started prematurely, then canceled during typecheck before Vite. Verified production /assets script remains intact; no dist overwrite. Full unit/native reruns are running; Pages and exact-head CI remain pending. No independent approval claimed.

## Resume point

Finish production build and SEO portability diagnostics, rerun affected/full checks sequentially. Run real native clipboard/download/options/budget flows and Pages prefix smoke; inspect full diff, open the one task PR and require exact-head CI before develop merge. Keep work/ logs untracked. No production resources.
