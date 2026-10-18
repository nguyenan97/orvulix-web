# Task checkpoint: review-codeql-dispositions

- Branch/base: feature/review-codeql-dispositions / develop 226cf0a9
- Phase: reviewing; PR pending; develop-merge; user requested R13 among all fixes.

The remediation ledger records five first-scan findings but develop currently has
six open alert identities. Complete all six source/sink dispositions, pin ref/SHA/
category and distinguish PR analysis counts from branch alert instances. Do not
change code merely to quiet a query, dismiss/suppress alerts or invent a severity
gate. No application/security policy/hosting/dependency change.

Acceptance: explicit develop REST list at b7bf878f has alerts 1-6; ledger covers
all identities including js/xss-through-dom at sanitize.ts:131, reviewed defenses,
remaining risk and owner/reassessment trigger. Historical access/count statements
must not masquerade as current state. Validate docs/source links and style; no new
runtime tests are needed for this documentation-only correction.

Source review: raw user HTML enters a detached inert template, then an allowlisted
rebuild, DOMPurify and a network-denying CSP in script-disabled sandboxed frames.
Existing native hostile HTML/asset suites passed in PR51 exact-head CI, and prior
three-engine review evidence covers unchanged sanitizer. This is not proof against
all payloads or a reason to silently close the high-scored alert.

Updated ledger covers #1-#6, pins the explicit branch analysis and preserves the
historical five-result/403 snapshot as history. Verified source/iframe/CSP paths
and alert #1 API instance; no new exploitation claim. Two documentation review
passes and style/diff checks pass. No runtime tests invented, policy weakened or
alert dismissed. Next: integrate final develop after prepared R07/R08 delivery,
refresh explicit-ref identity check if needed, one PR with exact-head CI/merge.

R07/R08 merged through 226cf0a9 and integrated with no conflict. Refreshed explicit
develop REST list still contains #1-#6, latest analysed commit 34da6993; new develop
analysis is pending. Ledger now pins that actual analysed SHA and names the newer
head separately. Corrected two stale prose statements about five findings and the
already-merged original remediation. No sanitizer/sink changes in these worker
slices. Final documentation review and style/diff checks apply to this full diff.
Next: push one docs-only PR, require exact-head CI and matched-head merge/cleanup.
