# Local Regex Assistant demo

`/regex-assistant` illustrates a future assistant workflow without a live model,
API key, AI dependency or paid inference. Hashtag, date-shape and log-level
suggestions/explanations are authored fixtures. Only an unchanged sample receives
its explanation; arbitrary inputs never receive fabricated AI output. Real
JavaScript regex testing works for custom expressions after explicit consent.
Results do not demonstrate a live Claude integration or startup-program approval.

## Execution and privacy

The UI validates size/flags without compiling the user's regex. Each test creates
a module worker; compilation and execution happen only there. A one-second timer
on the UI thread terminates the worker on timeout. Success, worker error,
invalid syntax, cancellation, input edits and unmount also terminate it. Late
results cannot replace results for new input. Worker startup counts toward the
deadline; slow devices can time out even on valid expressions. An unsupported
worker fails explicitly; there is no UI-thread fallback. Inputs stay in memory,
are not persisted, and are not sent to a provider. The site still loads normal
assets/translations/icons; that is distinct from uploading these inputs.

Limits: 16 KiB UTF-8 text, 2 KiB pattern, 100 displayed matches, first 20 numbered
and named captures, and 256 characters per preview. Flags use JavaScript semantics
(`d g i m s u v y`), including first-match-only without `g` or `y`, sticky matching,
and Unicode-safe advancement of empty global matches. Browser support varies;
unsupported syntax/flags surface as errors. Ranges are zero-based UTF-16 offsets
with exclusive ends; unmatched optional captures are null. Zero matches are a
successful test. Shape matching does not validate real dates, security rules or
business correctness. A timed worker does not prove a regex safe for production.
Text output is rendered as escaped React text, never HTML.

## Architecture and future Claude work

The additive module `src/ai/regex-assistant/` contains copy, fixtures, pure engine,
worker, runner, UI and tests. The router, shared SEO map and roadmap add integration
points; inherited tools/locales remain untouched. Static route metadata uses the
existing build generator; Pages retains its base path and noindex. Merge upstream
carefully at router, SEO map and CI hotspots.

A future Claude adapter must return distinctly labelled real output through a
server endpoint, require separate consent for transmitting text, keep credentials
off the client, and enforce rate/token limits, timeouts and spending controls.
Keep the local mode usable without credentials. Never automatically run generated
patterns on the UI thread; users must review and test them in the bounded worker.
No server endpoint or API key field is shipped in this demo.

## Verification and publication

Vitest checks fixtures, flags, limits, empty/Unicode matches, captures, runner
termination, timeout and cancellation. Browser tests exercise consent, custom
patterns, invalid syntax, a real catastrophic-backtracking timeout and recovery.
CI runs these alongside JSON Assistant and SEO browser checks, production build
validation and Pages artifact validation. There are no invented adoption metrics.

Feature PRs target `develop`. Merging into `develop` publishes the dev Pages site;
production remains on `main` until an explicitly authorized release. An applicant
can describe this as an implemented local UX/testing prototype and link to the
dev site after merge. Anthropic decides eligibility and review outcomes.
