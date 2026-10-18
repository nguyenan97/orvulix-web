# Docker Run to Compose: plan and execution prompt

## Plan

Next scoped backlog item after Text Workflow PR40: Docker Run to Compose (#379).
Research on 2026-10-17: upstream issue379 is open; its comments point to
Composerize and a contributor volunteering, not an accepted implementation. PR
search found deployment examples, not an integrated converter. No existing Docker
converter was found in Orvulix source. Do not claim upstream acceptance.

1. Implement a bounded POSIX-style tokenizer and whitelist parser in an isolated
   feature module. Do not evaluate input or invoke a shell/container/network API.
2. Map one Linux-container run command into modern Compose services. Support
   quoted/escaped literal values, continuation lines, ports, volumes, environment,
   network, name, restart, interactive/TTY and trailing command arguments.
3. Serialize a narrow YAML subset with JSON-quoted scalars and escaped Compose
   dollars. No new runtime dependencies: a general shell parser still needs Docker
   semantics and can accept expansion syntax this MVP deliberately rejects.
4. Add an explicit Convert UI, current-result ownership, literal copy/download,
   sample, clear, inline errors and documented unsupported syntax. Add thin
   registry/English/SEO integration and update only this roadmap milestone.
5. Validate literal contracts and boundaries, real downloaded YAML/clipboard,
   independent Docker Compose config parsing, production/Pages builds, keyboard
   and mobile. Review requirements and standards before exact-head CI/PR delivery.

## Execution prompt

Implement this one scoped MVP from updated develop on feature/docker-run-compose.
Follow AGENTS.md and the three repository workflow/communication/SDLC skills.
Create one PR into develop and merge only after acceptance, full-diff review and
exact-head CI. Preserve main/production, security policies and unrelated changes.

Create /converters/docker-run-to-compose. Accept exactly docker run or docker
container run with a Linux-container image and optional command argv. Implement
a deterministic bounded tokenizer for single/double quotes, empty quoted args,
backslash escapes and POSIX backslash-newline continuation. Reject incomplete
quotes/escapes, shell operators, substitutions, expansion/globs, multiple commands,
PowerShell/cmd syntax and unknown flags. Treat unsupported syntax as a visible
warning/error with no output, not a best-effort conversion that loses settings.

Whitelist -p/--publish, -v/--volume, -e/--env, --name, --restart,
--network/--net, -d/--detach, -i/--interactive and -t/--tty. Support repeated
ports/volumes/env, attached short values, short Boolean clusters, --flag=value,
-- before the image and trailing argv including flags. Repeated singleton options
are rejected; repeated env names use the last value with a notice. Detached mode
is an invocation choice, reported as a notice, not a YAML property. Unsupported
flags such as --rm, --mount and --privileged must never silently disappear.

Keep service name explicit (default app). Preserve container_name separately.
Generate string-valued environment entries, including empty values and explicit
host passthrough names. Preserve command argv without joining it into shell text.
Escape every literal dollar as $$ for Compose. Support valid TCP/UDP port numbers,
host bindings and equal-size ranges; reject unsupported/invalid forms. Map bind,
named and anonymous -v mounts with ro/rw; preserve named volume names through
top-level declarations. Custom networks reference existing names as external;
bridge/host/none use network_mode (default is an alias for bridge). Default bridge preserves the usual Linux docker
run network instead of silently creating a Compose project network. Reject ports
with host/none and unsupported namespace/network forms. No env-file reading.

Bound source at 32,768 UTF-16 units before tokenizing, 512 tokens, 128 option
occurrences and 131,072 output units. Reject NUL, unsupported control characters
and malformed Unicode. Use linear scans and bounded structures; explicit synchronous
conversion is proportionate to this small input cap, not a hard time/heap quota.
Never truncate or persist source/results. Current output is invalidated immediately
on source/service edits, Clear, invalid conversion and unmount. Native copy and
download must use only the current successful exact YAML. Render literal text.

Tests must use independent expected values, not call the production serializer to
build expectations. Cover quotes, Unicode, empty args, continuation, dollar
interpolation, malformed/unsupported syntax, duplicate options, ports, mount/network
names, restart, boundaries, current output and valid recovery. Validate authored
fixtures using docker compose config only, never run/up or execute pasted input.
Keep existing assertions/retries/deadlines/security gates. Verify Pages prefix,
noindex and static metadata. Record outcomes honestly in the task checkpoint/PR.

## Supported scope and limits

This is a POSIX command-text subset for Linux containers, not a shell interpreter
or complete Docker CLI. Quoted literal shell characters are preserved; unquoted
expansion and execution syntax is rejected. Supply resolved values, or single-quote
literal dollars. No shell history, .env file, image or Docker daemon is accessed.
Bind sources support absolute POSIX paths or quoted Windows drive paths; container
targets must be absolute POSIX paths. Only ro/rw volume modes are supported.
Bind mappings explicitly set create_host_path to true to retain docker run -v
host-directory creation behavior. The converter itself never creates host paths.
Named volumes are declared with explicit Docker names; review existing volume
driver/options before running Compose. Custom networks must already exist.
Compose lifecycle/defaults can differ from a one-off CLI invocation; review output
before use. Generated files contain supplied environment values and may be sensitive.

References reviewed: [Docker run](https://docs.docker.com/reference/cli/docker/container/run/),
[Compose services](https://docs.docker.com/reference/compose-file/services/),
[Compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/),
[upstream issue379](https://github.com/iib0011/omni-tools/issues/379).
Sync hotspots: converters registry/English metadata, SEO overrides/inventory,
roadmap status and focused Pages browser CI selection. Converter-specific explicit
audiences override the inherited media default, so developer search can find this
tool; existing media-converter membership is covered by regression tests. No shared
editor rewrite or unrelated audience-policy migration.

Independent oracle note: Compose v5.1.4 config output re-escapes dollar signs in
its serialized JSON/YAML. The config-only fixture check accounts for that presentation
layer, with hostile host variable values to detect accidental input interpolation.
See [the pinned config implementation](https://github.com/docker/compose/blob/v5.1.4/cmd/compose/config.go).
