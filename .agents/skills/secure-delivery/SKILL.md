---
name: secure-delivery
description: Select and verify Orvulix security checks for changed trust boundaries, dependencies, CI or release preparation. Use for security work and risk-bearing implementation; does not authorize production scanning or deployment.
---

# Verify security boundaries and evidence

Read [security controls and gaps](../../../docs/SECURE_DELIVERY.md) and the current
[remediation record](../../../docs/SECURITY_REMEDIATION.md). Inspect workflow and
package scripts before reporting which controls run or block delivery.

For a changed parser, renderer, import, worker, remote service or CI job, trace
source -> transformation -> sink and record trust boundary, resource budget,
failure handling and data/network exposure. Select applicable controls from the
matrix; mark irrelevant controls N/A with a reason. Prefer local fixtures/builds.

Run the existing audit gate for dependency changes; preserve exact exceptions,
owner and expiry. Verify secret scanning of the latest tree/history in CI. Inspect
CodeQL findings and their dispositions, not only the analysis job's green status.
Do not treat the metadata summary as a high/critical severity gate.

Review unsafe DOM/URL/message boundaries and worker cancellation/resource cleanup
when touched. Prove artifact fidelity and malicious-input isolation in native
browsers when emulators/mocks cannot establish them. Never print secret matches,
user documents or raw scanner payloads to public logs or reports.

Block unresolved task-introduced exploitable security defects and unreviewed new
findings. Existing findings need a specific disposition; blanket baselines and
severity downgrades are not fixes. Scanner outage/invalid output is unknown/fail,
not a clean scan. Rotate exposed credentials through the owner; deleting text
does not revoke a credential. Do not rewrite shared history implicitly.

Complete with commands, scanner version, SHA, result, finding disposition and
remaining gaps linked in the checkpoint/PR. Production readiness still requires
the release checklist and explicit release authorization.
