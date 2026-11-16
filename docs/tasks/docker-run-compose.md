# Task checkpoint: docker-run-compose

- Updated: 2026-10-18 Asia/Bangkok
- Branch / base: feature/docker-run-compose / develop e61aac398e51cfb2bd3ef7c63dbfd5973d83e4d8
- PR: https://github.com/nguyenan97/orvulix-web/pull/41
- Phase: local acceptance/review complete, exact-head CI pending
- Delivery mode: develop-merge. User requested plan, prompt and execution of the
  next task. One backlog item only; main/production/subsequent tasks excluded.
- Last verified runtime head: 5c4093934780e0107a967aa4da8a0382781f84ba,
  including explicit bind creation and literal unit/browser assertions. This
  checkpoint update changes documentation only. Resolve its containing SHA and
  exact latest-head CI from Git/PR on resume.

## Scope and implementation

Authored plan, execution prompt, acceptance and non-goals: ../DOCKER_RUN_COMPOSE.md.
Route /converters/docker-run-to-compose. Browser-local explicit conversion of one
Linux-container POSIX command-text subset, never execution. Bounded literal lexer,
Docker whitelist, Compose-safe quoted YAML, native copy and raw YAML download.
Unknown flags/expansion/ambiguous syntax block output. Source/service edits, Clear,
invalid conversions and unmount revoke exports; late clipboard toasts are ignored.

Ports, ro/rw bind/named/anonymous volumes, env (empty/pass-through/last-wins notice),
name, restart, one network, interactive/TTY/detach notice and trailing argv included.
Literal dollars are doubled for Compose; named volumes retain explicit names,
custom networks are external, default network mode is bridge. Explicit converter
audiences override only that category's media default; all previous media membership
is preserved. No new dependency, shared editor rewrite or hosting/security change.

Limits: 32,768 UTF-16 source units before tokenization, 512 tokens, 128 option
occurrences, 131,072 output units. No truncation or content persistence. These are
admission bounds, not strict CPU/heap quotas. POSIX text and Linux-container scope,
unsupported flags, host path/lifecycle differences and sensitive output are disclosed.

## Evidence and review

- Full frozen-source Vitest at ffce82c: 158 files / 1,546 tests pass, 300.81s.
  Previous overlapping full run failed the newly added audience assertion before
  its correction; it is not reused as passing evidence. Existing locale backend/
  disabled PDF iframe stderr remains nonfatal.
- Final affected unit/integration after explicit bind mapping: 104 tests / 6 files
  pass, including 86 feature cases, discovery/audience and SEO/roadmap.
- Independent Docker Compose v5.1.4 config-only oracle: five authored fixtures pass
  (minimal, full literal argv/Unicode/dollars/options, reserved names/escapes,
  anonymous read-only/IPv6 ranges, explicit bind path creation). No container runs.
  CLI config re-escapes its output dollars and omits default true bind creation;
  verified presentation behavior, hostile host interpolation values and raw
  no-interpolate/no-normalize config retain independent checks.
- Production typecheck/build/SEO/sitemap after bind follow-up passes: 159 indexable
  routes, 137 tools, 14 categories, 152 lastmod URLs and preserved 404.
- After bind follow-up: native production 21/21 (59.11s), Pages 21/21 (37.68s)
  across Chromium/Firefox/WebKit, retries=0 and zero skipped/flaky/unexpected.
  Native download assertions include the exact bind mapping and creation flag.
  Pages rerun completed on 2026-10-18 against runtime head5c409393 after resume.
- Final Pages typecheck/build: 160 HTML files; root/tool/roadmap/404 checked for
  noindex, no canonical and /orvulix-web/ assets. The preview exited after tests.
- Desktop1440/mobile390 dark screenshots inspected, no horizontal overflow.
  UI sample is named-volume-only, unchanged by the bind follow-up.
- Changed-source ESLint, text style and full diff whitespace checks pass after
  the bind follow-up and resumed review.
  Security harness26, fresh audit gate and Pages prepare1 pass. Existing audit15
  package findings / 6 advisories / exact braces exception unchanged.
- Initial-head Security CI39040235857 passes; CodeQL remains the same five
  previously triaged findings in existing files. This does not validate a later
  head. Focused CI enumerates 178 browser tests / 27 files, existing cases retained.

Standards review: isolated parser/serializer/UI, thin metadata/registry/SEO and
scoped converter audience integration. No eval, shell/runtime network input path,
untrusted object merge, content storage, new dependency or production change.
Fixed schema/Map, source and output budgets, literal rendering, cleanup and
synchronous export revocation inspected. MUI retained after React skill review.
Pages/noindex/404 and upstream sync hotspots documented.

Requirements review: supported flags/quotes/empty argv/order/interpolation/names,
invalid input/recovery, budget boundaries, current exports, mobile keyboard,
developer search and static route verified. Open upstream issue379/comments
reviewed; no upstream acceptance claim. Unknown options never silently disappear.
Resumed review on 2026-10-18 rechecked the full parser/serializer/UI, supported
contracts, test oracles and integration diff against unchanged develop e61aac39.
No new task-blocking finding; exact latest-head CI remains the final delivery gate.
Self-review is not independent approval; inspect actual GitHub review requirements.

Findings corrected: test oracle YAML escaping, unit matcher misuse, ambiguous browser
alert locator, audience hiding, default network alias, anonymous ro/rw, short equals
values, noncanonical host IPv4 and bind creation made explicit. No assertion removed
or deadline/retry/security gate relaxed. CLI config-only presentation corrections
are documented rather than reported as application bug reproductions.

## Resume / delivery gates

All local acceptance and review gates are complete. Native/build/Pages sessions
have exited. Commit this checkpoint and push the pending bind follow-up on the
same PR41; update its evidence and mark ready. Exact latest-head Pages/Security CI
must finish green; initial-head green CI is not sufficient for the final head.
Re-fetch develop, review full diff/base/rules, matched-head merge into develop,
verify ancestry/tree and safe task branch cleanup. No production/main release.
PR metadata/run links are authoritative for gates completed after this checkpoint.

Dev watcher PID29800 identity verified/stopped. Playwright owns preview lifecycle.
Task-only scratch under work/: docker-compose-oracle.cjs, docker-convert.cjs,
docker-minimal.yaml, docker-literals.yaml, docker-reserved-and-escapes.yaml,
docker-anonymous-ipv6-range.yaml, docker-bind-path-creation.yaml, docker-bind-probe.yaml,
docker-native.json, docker-pages.json, docker-pages.config.ts, docker-unit.log,
docker-production-build.log, docker-pages-build.log, docker-visual.mjs,
docker-desktop.png, docker-mobile.png, docker-pr.md. Remove only verified owned
artifacts at delivery; preserve unrelated files and main/develop.
