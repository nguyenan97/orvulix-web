# Dependency security remediation

Status: implemented on feature/security-hardening, not merged or deployed.
Audit/release research date: 2026-10-14. Counts are snapshots, not policy thresholds.

## Threat model and exposure

Orvulix is a Vite/React SPA processing user-controlled HTML, XML, PDF, images and
regex. User content should remain in the browser; some existing tools download
third-party models/assets. Local processing is not a claim that every tool makes
zero network requests. Production uses Netlify/main; development uses Pages/develop.
Build/test tools run in CI and on developer machines, a different trust boundary.

The baseline full audit reported 61 package findings (6 critical, 37 high,
16 moderate, 2 low), representing 133 distinct advisory IDs, including 67 high/
critical IDs. The production dependency audit reported 27 package findings (2
critical, 13 high, 10 moderate, 2 low). npm's production classification does not
prove browser reachability: this repository also declares some tooling in dependencies.

After remediation, the full tree reports 15 package findings (0 critical, 6 high,
8 moderate, 1 low), representing six advisory IDs. The production dependency tree
reports seven package findings (0 critical/high, 6 moderate, 1 low). The six high
package findings are one concrete advisory in braces and its affected dependants,
not six independent vulnerabilities. Re-run the audit for current results.

Runtime consumers checked:

- XML formatter/validator import fast-xml-parser and accept pasted/uploaded XML.
  Compatible v5 upgrade fixes entity/DOCTYPE and builder advisories. Existing
  formatting/validation tests plus numeric-entity/expansion regressions are required.
  The tested pathological DOCTYPE leaves an escaped unresolved reference rather
  than expanding it; invalid numeric references remain escaped text. This is a
  parser behavior change, not a claim the formatter preserves arbitrary DTDs.
- ONNX Runtime Web requires protobufjs ^7.2.4. Its compatible 7.x lockfile refresh
  fixes code-generation/descriptor parsing advisories without changing ONNX/WASM
  versions or image model handling. App imports background-removal with predefined
  model configuration; no user .proto/schema input was found. Absence of that path
  does not make the old library safe. Wire encode/decode regression covers the update.
- Lodash is used by debouncing and other utility integrations; lodash-es is pulled
  by Formik/background-removal. Refresh both within major 4, including template/
  prototype-pollution fixes. No production _.template call was found; guards test
  the library anyway rather than claiming unreachable means safe.
- BrowserRouter/useRoutes and static tool links consume React Router. Stay on
  React Router 6; patched 6.x removes high redirect issues. Moderate backslash Link/
  navigate and SSR hydration advisories still affect the published range. SSR
  hydration is absent, and app navigation uses registered paths, but the dependency
  remains affected. Do not accept arbitrary user-provided navigation destinations.

Build/dev consumers checked: Vite/esbuild/Rollup, ESLint/typescript-eslint,
PostCSS, test runner/UI/DOM environment, lint-staged and browser readiness tooling.
Dependency paths were checked with npm explain/npm ls. Compatible transitive
refreshes preserve parent semver ranges; no overrides force incompatible majors.
Locize SDK, locize-cli and i18next-locize-backend have no app/config/CLI consumers
in the repository and are removed. scripts/locize-upload.js uses node:https and
continues to work independently. Removing the unused CLI also removes csvjson's
unpatched prototype-injection path from this installation.

## Targeted changes and migration

React 18, MUI, React Router 6, directory layout and SPA deployment remain intact.
No runtime security dependency, paid service, backend or site-wide CSP is added.
jsdom is a dev-only addition needed for DOMPurify-compatible fidelity testing.
All selected root packages retain their declared licenses (MIT for Vite, Vitest,
DOM emulators, XML parser and typescript-eslint).

Vite 6 and Vitest 4 require typed config from vitest/config. CI uses Node 24 LTS;
package engines retain Node 20.19+/22.12+ compatibility without implying those
versions are all still supported. Vitest/UI versions are paired. No test deadlines,
retries, worker-count settings or assertions are weakened to accommodate migration.

Patched happy-dom remains the lifecycle/unit emulator. Its DOM does not implement
DOMPurify's current safe accessor semantics faithfully, so sanitizer/header-clone
and pagination DOM fidelity fixtures explicitly use jsdom 26.1.0. jsdom 27.4.0
was evaluated but introduced unnecessary selector/binary API migration costs;
26.1.0 has no direct audit advisory in the installed tree. Do not treat happy-dom
sanitization behavior or mocked canvas output as production security/fidelity proof.
Native Chromium/Firefox/WebKit flows verify actual output and isolation.

Both emulators disable inline script execution; happy-dom resource loading is
explicitly disabled. Unit pagination readiness uses an explicitly owned document/
load callback, not jsdom's unrelated about:blank load. Two Shuffle tests now pass
undefined explicitly instead of accidentally using window.length. Test intent and
output assertions remain unchanged. No application tool service is rewritten.

## Temporary exception and remaining work

security/audit-exceptions.json accepts only GHSA-vfj7-8cjw-p6xm on the exact
node_modules/braces path/version 3.0.3 at high severity, owner nguyenan97, until
2026-11-13. npm still publishes 3.0.3 as its latest version; Tailwind 3/chokidar/
micromatch/fast-glob/ESLint plugin consume it. User HTML/regex/files are not passed
to this glob parser. Only repository content patterns are processed. A hostile PR
can still exhaust an isolated CI job: no secrets or privileged PR execution are
permitted. This is accepted temporarily, not resolved or proven unexploitable.
Review a patched release or a separately designed Tailwind integration migration
before expiry. A passing gate with this exception does not give production approval.

Remaining moderate/low findings:

- Jimp 0.x/file-type: malformed ASF parsing can hang the old sniffing path. Jimp's
  real image consumers remain exposed to user files. Moving to Jimp 1.x or replacing
  the decoder requires service/API/bundle review and targeted hostile-file/browser
  tests. This remains a runtime risk and a production release decision, not waived
  by the high/critical gate.
- React Router 6: retain the moderate advisory disposition above; a Router 7
  migration or a compatible vendor backport is separate work.
- postcss-selector-parser: older copies remain under existing Tailwind tooling;
  repository selectors are trusted inputs, but untrusted PR jobs remain bounded
  only by the CI runner. Review compatible parent changes before a CSS migration.
- min-document: legacy virtual DOM dependency has a low prototype-pollution
  advisory. No direct app import was found; preserve attribution and investigate
  the upstream consumer before a compatibility-breaking replacement.

Node 20 ended support on 2026-04-30 according to the official release schedule.
CI now uses supported Node 24, but netlify.toml still requests Node 20. Changing
Netlify configuration was explicitly excluded. Move that build environment to a
supported LTS in an authorized follow-up before approving a production release.
The PR does not change hosting settings, Netlify headers, functions or routing.

The HTML conversion CSP/data-only asset policy, renderer cleanup and regex worker
bounds are preserved. Existing ToolDiffResult sanitizes HTML with DOMPurify. Only
VITE_PAGES_DEV was found in tracked client environment usage; all VITE_* values
must be considered public. This scan does not inspect private dashboard secrets.
Site-wide CSP requires separate compatibility work for MUI styles, workers, WASM,
blob/data URLs and model downloads; no unsafe-eval/wildcard policy is introduced.

## Audit gate and CI

npm run security:audit reports full/production trees, with exit 1 for findings.
npm run security:check gates concrete high/critical advisory ID + package + exact
lockfile path/version, not totals. Same-count replacements and severity escalation
fail. npm run security:test uses deterministic Node fixtures, not live advisories.

A report must be npm audit v2 with complete matching package/severity totals,
valid advisory IDs and installed lockfile nodes. Unknown schema/identities,
registry errors, invalid JSON, unexpected exits, missing nodes or audit timeout
fail closed. Native npm exit 1 with findings is not confused with a network failure.
No registry stderr/raw credentials are printed; no content-bearing artifacts are
uploaded. Audits are bounded to 120 seconds/8 MiB per invocation.

Exceptions require exact identity/path/version, severity ceiling, scope, reason,
mitigation, owner and valid expiry. Expired, duplicate, stale or nonmatching entries
fail until reviewed. Fixed advisories require exception cleanup. Policy changes
must be reviewed in the PR; scripts cannot prevent a writer changing their own
policy. Branch protection/reviewer enforcement remains a repository-owner setting.

Security workflow audits the lockfile without npm install hooks or app deployment.
It uses read-only permissions for audit and job-scoped security-events:write for
CodeQL. Public repository eligibility was checked. CodeQL JavaScript/TypeScript
uses build-mode:none; it does not execute untrusted PR application code or install
packages. Fork PR analysis does not upload using write credentials. CodeQL alerts
require triage; upload success alone is not a zero-findings result. A SARIF summary
logs only rule IDs, severities and locations when API access is unavailable;
messages, snippets and traces are excluded. No duplicate
Dependency Review gate is added: the npm gate already checks the resolved tree
and exact temporary exception, while CodeQL examines application code.

Checkout/setup-node/CodeQL Actions are pinned to commit SHAs verified through
GitHub tag/commit APIs. Existing production and Pages CI move to Node 24 without
changing triggers or deployment conditions. PR checks do not deploy.

Dependabot weekly version updates target develop with small open-PR limits and
paired minor/patch Vitest/Vite groups. Majors remain separate; no ignore rule or
auto-merge is added. GitHub security updates follow the default branch, not the
custom target-branch for version updates. No security-update settings are enabled
that would implicitly authorize PRs into main.

main is the default branch. Dependabot discovery and scheduled security runs are
not fully active just because files exist on develop: activation requires those
configs on the default branch in a separately authorized release. PR security
checks do run for this feature PR. Private vulnerability reporting was disabled
when checked; SECURITY.md documents a private-contact fallback without inventing
an address, monitored mailbox or response SLA.

## Validation and integration hotspots

See the PR for exact-head results of fresh npm ci, typecheck, security gate/tests,
full unit suite, production/Pages builds and native browser regressions. Output
bytes and pixels must be tested, not only filenames or mocked encoders. Neither
audit nor CodeQL alone is proof that every application security defect is fixed.

Sync hotspots: package/lock, Vite test configuration, three DOM unit fixtures,
explicit Shuffle test argument and existing CI Node/Action declarations. New gate,
policy, security workflow, Dependabot config, regression tests and docs are isolated.
No Netlify configuration, SSR, framework migration, tool-service rewrite, unrelated
locale changes, paid API or production deployment is included.

## Sources

- [GitHub advisory database](https://github.com/advisories), individual identities below.
- [Vite 6 migration](https://v6.vite.dev/guide/migration).
- [Vitest 4 migration](https://v4.vitest.dev/guide/migration.html).
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
- [CodeQL eligibility and behavior](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql).
- [Dependency review](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review).
- [Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/privately-reporting-a-security-vulnerability).
- [Node release schedule](https://github.com/nodejs/Release/blob/main/schedule.json).

## Installed versions

| Package | Before | After |
| --- | --- | --- |
| fast-xml-parser | 5.2.5 | 5.11.2 |
| protobufjs | 7.5.4 | 7.6.6 |
| lodash | 4.17.21 | 4.18.1 |
| lodash-es | 4.17.21 | 4.18.1 |
| react-router-dom | 6.30.1 | 6.30.6 |
| @remix-run/router | 1.23.0 | 1.23.4 |
| vite | 5.4.20 | 6.4.4 |
| vitest | 1.6.1 | 4.1.11 |
| @vitest/ui | 1.6.1 | 4.1.11 |
| happy-dom | 12.10.3 | 20.14.6 |
| jsdom | not installed | 26.1.0 |
| esbuild | 0.21.5 | 0.25.12 |
| @typescript-eslint/parser | 6.21.0 | 8.71.2 |
| @typescript-eslint/eslint-plugin | 6.21.0 | 8.71.2 |
| postcss | 8.5.6 | 8.5.30 |
| lint-staged | 15.5.2 | 16.4.0 |
| rollup | 4.52.3 | 4.64.6 |
| axios | 1.12.2 | 1.20.0 |
| form-data | 4.0.4 | 4.0.6 |
| joi | 18.0.1 | 18.2.9 |
| locize | 4.0.14 | removed |
| locize-cli | 10.3.2 | removed |
| i18next-locize-backend | 7.0.4 | removed |

## Baseline high/critical advisory disposition

Each concrete advisory is listed with its reported affected range and the installed
replacement. A disappearance from this resolved tree is not a claim the package
is universally safe. Related parent package findings inherit these advisories.

| Package / advisory | Severity | Reported affected range | Current installed versions / disposition |
| --- | --- | --- | --- |
| @remix-run/router / [GHSA-2w69-qvjg-hvjx](https://github.com/advisories/GHSA-2w69-qvjg-hvjx) | high | `<=1.23.1` | 1.23.4 - resolved in audit |
| axios / [GHSA-pmwg-cvhr-8vh7](https://github.com/advisories/GHSA-pmwg-cvhr-8vh7) | high | `>=1.0.0 <1.15.1` | 1.20.0 - resolved in audit |
| axios / [GHSA-pf86-5x62-jrwf](https://github.com/advisories/GHSA-pf86-5x62-jrwf) | high | `>=1.0.0 <1.15.1` | 1.20.0 - resolved in audit |
| axios / [GHSA-6chq-wfr3-2hj9](https://github.com/advisories/GHSA-6chq-wfr3-2hj9) | high | `>=1.0.0 <1.15.1` | 1.20.0 - resolved in audit |
| axios / [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) | high | `>=1.0.0 <=1.13.4` | 1.20.0 - resolved in audit |
| axios / [GHSA-q8qp-cvcw-x6jj](https://github.com/advisories/GHSA-q8qp-cvcw-x6jj) | high | `>=1.0.0 <1.15.2` | 1.20.0 - resolved in audit |
| axios / [GHSA-hfxv-24rg-xrqf](https://github.com/advisories/GHSA-hfxv-24rg-xrqf) | high | `>=1.0.0 <1.16.0` | 1.20.0 - resolved in audit |
| axios / [GHSA-777c-7fjr-54vf](https://github.com/advisories/GHSA-777c-7fjr-54vf) | high | `>=1.7.0 <1.16.0` | 1.20.0 - resolved in audit |
| axios / [GHSA-p92q-9vqr-4j8v](https://github.com/advisories/GHSA-p92q-9vqr-4j8v) | high | `>=1.0.0 <1.16.0` | 1.20.0 - resolved in audit |
| axios / [GHSA-j5f8-grm9-p9fc](https://github.com/advisories/GHSA-j5f8-grm9-p9fc) | high | `>=1.0.0 <1.16.0` | 1.20.0 - resolved in audit |
| axios / [GHSA-3g43-6gmg-66jw](https://github.com/advisories/GHSA-3g43-6gmg-66jw) | high | `>=1.0.0 <1.15.2` | 1.20.0 - resolved in audit |
| axios / [GHSA-35jp-ww65-95wh](https://github.com/advisories/GHSA-35jp-ww65-95wh) | high | `>=1.0.0 <1.16.0` | 1.20.0 - resolved in audit |
| brace-expansion / [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | `>=2.0.0 <2.1.2` | 1.1.21, 2.1.7, 5.0.12 - resolved in audit |
| brace-expansion / [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | `<1.1.17` | 1.1.21, 2.1.7, 5.0.12 - resolved in audit |
| brace-expansion / [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | `>=2.0.0 <2.1.4` | 1.1.21, 2.1.7, 5.0.12 - resolved in audit |
| brace-expansion / [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | high | `<1.1.20` | 1.1.21, 2.1.7, 5.0.12 - resolved in audit |
| brace-expansion / [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | high | `<1.1.19` | 1.1.21, 2.1.7, 5.0.12 - resolved in audit |
| braces / [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | high | `<=3.0.3` | 3.0.3 - accepted temporarily, expires 2026-11-13 |
| browserslist / [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) | high | `<=4.28.6` | 4.29.3 - resolved in audit |
| browserslist / [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | high | `<=4.28.6` | 4.29.3 - resolved in audit |
| csvjson / [GHSA-xq4f-3jxp-qv6m](https://github.com/advisories/GHSA-xq4f-3jxp-qv6m) | high | `<=5.1.0` | unused dependency chain removed |
| fast-uri / [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) | high | `>=3.0.0 <=3.1.3` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) | high | `>=3.0.0 <3.1.5` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-q3j6-qgpj-74h6](https://github.com/advisories/GHSA-q3j6-qgpj-74h6) | high | `>=3.0.0 <=3.1.0` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-v39h-62p7-jpjc](https://github.com/advisories/GHSA-v39h-62p7-jpjc) | high | `>=3.0.0 <=3.1.1` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | high | `>=3.0.0 <3.1.6` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | high | `>=3.0.0 <3.1.6` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) | high | `>=3.0.0 <3.1.3` | 3.1.8 - resolved in audit |
| fast-uri / [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | high | `>=3.0.0 <3.1.7` | 3.1.8 - resolved in audit |
| fast-xml-parser / [GHSA-37qj-frw5-hhjh](https://github.com/advisories/GHSA-37qj-frw5-hhjh) | high | `>=5.0.9 <=5.3.3` | 5.11.2 - resolved in audit |
| fast-xml-parser / [GHSA-m7jm-9gc2-mpf2](https://github.com/advisories/GHSA-m7jm-9gc2-mpf2) | critical | `>=5.0.0 <5.3.5` | 5.11.2 - resolved in audit |
| fast-xml-parser / [GHSA-jmr7-xgp7-cmfj](https://github.com/advisories/GHSA-jmr7-xgp7-cmfj) | high | `>=5.0.0 <5.3.6` | 5.11.2 - resolved in audit |
| fast-xml-parser / [GHSA-8gc5-j5rx-235r](https://github.com/advisories/GHSA-8gc5-j5rx-235r) | high | `>=5.0.0 <5.5.6` | 5.11.2 - resolved in audit |
| flatted / [GHSA-25h7-pfq9-p65f](https://github.com/advisories/GHSA-25h7-pfq9-p65f) | high | `<3.4.0` | 3.4.4 - resolved in audit |
| flatted / [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) | high | `<=3.4.1` | 3.4.4 - resolved in audit |
| form-data / [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) | high | `>=4.0.0 <4.0.6` | 4.0.6 - resolved in audit |
| glob / [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) | high | `>=10.2.0 <10.5.0` | 10.5.0, 7.2.3 - resolved in audit |
| happy-dom / [GHSA-96g7-g7g9-jxw8](https://github.com/advisories/GHSA-96g7-g7g9-jxw8) | critical | `<15.10.2` | 20.14.6 - resolved in audit |
| happy-dom / [GHSA-37j7-fg3j-429f](https://github.com/advisories/GHSA-37j7-fg3j-429f) | critical | `<20.0.0` | 20.14.6 - resolved in audit |
| happy-dom / [GHSA-w4gp-fjgq-3q4g](https://github.com/advisories/GHSA-w4gp-fjgq-3q4g) | high | `<20.8.9` | 20.14.6 - resolved in audit |
| joi / [GHSA-6h2x-m376-mqjq](https://github.com/advisories/GHSA-6h2x-m376-mqjq) | high | `>=18.0.0 <18.2.6` | 18.2.9 - resolved in audit |
| js-yaml / [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | high | `>=4.0.0 <4.3.0` | 4.3.2 - resolved in audit |
| js-yaml / [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | high | `>=4.0.0 <4.3.1` | 4.3.2 - resolved in audit |
| js-yaml / [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | high | `>=4.0.0 <4.3.2` | 4.3.2 - resolved in audit |
| locize / [GHSA-w937-fg2h-xhq2](https://github.com/advisories/GHSA-w937-fg2h-xhq2) | high | `<4.0.21` | unused dependency chain removed |
| lodash / [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) | high | `>=4.0.0 <=4.17.23` | 4.18.1 - resolved in audit |
| lodash-es / [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) | high | `>=4.0.0 <=4.17.23` | 4.18.1 - resolved in audit |
| minimatch / [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | high | `<3.1.3` | 10.2.6, 3.1.5, 9.0.9 - resolved in audit |
| minimatch / [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | high | `<3.1.3` | 10.2.6, 3.1.5, 9.0.9 - resolved in audit |
| minimatch / [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | high | `<3.1.4` | 10.2.6, 3.1.5, 9.0.9 - resolved in audit |
| nanoid / [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | high | `<3.3.16` | 3.3.20 - resolved in audit |
| nanoid / [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | high | `<3.3.18` | 3.3.20 - resolved in audit |
| nanoid / [GHSA-xwg4-73v4-xw9w](https://github.com/advisories/GHSA-xwg4-73v4-xw9w) | high | `<3.3.12` | 3.3.20 - resolved in audit |
| picomatch / [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | high | `<2.3.2` | 2.3.2, 4.0.7 - resolved in audit |
| postcss / [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | high | `<=8.5.11` | 8.5.30 - resolved in audit |
| postcss / [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | high | `<=8.5.17` | 8.5.30 - resolved in audit |
| protobufjs / [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) | critical | `<7.5.5` | 7.6.6 - resolved in audit |
| protobufjs / [GHSA-66ff-xgx4-vchm](https://github.com/advisories/GHSA-66ff-xgx4-vchm) | high | `<=7.5.5` | 7.6.6 - resolved in audit |
| protobufjs / [GHSA-75px-5xx7-5xc7](https://github.com/advisories/GHSA-75px-5xx7-5xc7) | high | `<=7.5.5` | 7.6.6 - resolved in audit |
| protobufjs / [GHSA-jvwf-75h9-cwgg](https://github.com/advisories/GHSA-jvwf-75h9-cwgg) | high | `<=7.5.5` | 7.6.6 - resolved in audit |
| protobufjs / [GHSA-685m-2w69-288q](https://github.com/advisories/GHSA-685m-2w69-288q) | high | `<=7.5.5` | 7.6.6 - resolved in audit |
| protobufjs / [GHSA-wcpc-wj8m-hjx6](https://github.com/advisories/GHSA-wcpc-wj8m-hjx6) | high | `<=7.6.0` | 7.6.6 - resolved in audit |
| rollup / [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) | high | `>=4.0.0 <4.59.0` | 4.64.6 - resolved in audit |
| source-map-js / [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | high | `>=1.0.0 <1.2.2` | 1.2.2 - resolved in audit |
| tinypool / [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) | critical | `<=2.1.0` | unused dependency chain removed |
| tinypool / [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) | critical | `<2.1.2` | unused dependency chain removed |
| vite / [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | high | `<=6.4.2` | 6.4.4 - resolved in audit |
| vitest / [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) | critical | `<3.2.6` | 4.1.11 - resolved in audit |
