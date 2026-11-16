# GIF timing controls

## Execution prompt

Continue the next incomplete ordered backlog item from updated develop on
feature/gif-timing-controls. Deliver one bounded Images to GIF timing UX slice:
explicit accessible FPS/ms controls, approximately interval-preserving mode
switches with visible range adjustments, editable invalid drafts, pre-worker
validation and honest timing precision guidance. Preserve explicit Create,
ordering, cancellation, encoder output and existing resource limits. Reuse the
installed stack/dependencies. Follow AGENTS.md and SDLC: tests, native artifact
checks, production/Pages builds, full diff and security self-review, exact-head
CI, one PR into develop, authorized merge and safe branch cleanup. No production
release or further backlog task is included.

## Scope and acceptance

Before: switching 10 FPS to delay reuses the number 10 as milliseconds, below the
UI's 50 ms minimum. Cleared/out-of-range edits silently clamp. Direct service
callers can pass invalid timing into the shared worker. Users cannot reliably
interpret the input's unit or GIF timing precision.

- AC1: Given 10 FPS, when switching to delay, then show 100 ms. Given 200 ms,
  switching to FPS yields 5. Mode switches preserve requested interval where both
  ranges allow it, rounded to six decimal places; repeated current-mode selection
  retains output. Outside the other range, explicitly adjust to its boundary and
  announce that adjustment. Invalid timing switches reset to a disclosed default.
- AC2: Given empty, zero, negative, non-finite or out-of-range timing, when editing,
  retain the draft, explain the accepted range and disable Create. Valid correction
  re-enables it. The service rejects invalid timing before shared worker startup.
- AC3: Given any timing edit or changed mode, invalidate output immediately and
  cooperatively cancel publication. Selection/order/cancel/import/cleanup behavior
  is retained. Never auto-start encoding on edits.
- AC4: Given valid FPS/delay, show requested milliseconds and equivalent FPS,
  distinguish that request from decoded output and explain GIF 10 ms precision.
  Do not promise exact duration, frame count or rounding. Native fixtures retain
  existing color/order/loop/delay output: 2 frames at requested 200 ms produce the
  inherited 3 encoded frames at 20 centiseconds, including its extra final frame.
- AC5: Accessible radio group and unit-specific number label, keyboard/mobile
  operation; preserve Pages URL prefix/noindex and accurate roadmap/SEO copy.

Ranges remain FPS 1..60, delay 50..10000 ms. Finite fractional values are accepted;
HTML step is any. Draft empty string is UI-only, never a valid encoder value.
Timing summary uses at most six decimals for unit conversion, three for display.
These display decimals do not increase GIF precision.

Pure policy: src/features/gif-conversion/timing.ts. Local controls compose it;
service validates before runFFmpegTask. No shared Formik/FFmpeg contract changes,
new dependency, codec, asset origin, upload or persistence. Existing shared FFmpeg
queue, cooperative cancellation and image/temporary-file budgets remain in force;
active exec/startup cannot be force-stopped by this owner. Homogeneous codec limits
are not expanded or certified by this timing change. No memory/CPU guarantee added.

Strategic boundary: one requested timing value in its selected unit; only valid
finite timing crosses into encoding. UI draft state must not silently become a
valid value. No new generic abstraction or ADR needed for this feature-local rule.
Rollback restores the timing adapter/service check together. Upstream hotspots:
the inherited Images to GIF page/types/service; controls/policy remain isolated.
Upstream issue #433 is closed; PR458 merged drag/drop on 2026-10-13. This slice
is Orvulix development work, not a claim of upstream timing acceptance.

## Evidence plan

AC1/AC2: pure policy examples, UI tests and service pre-worker rejection.
AC3: existing job/UI/runtime cancellation suites plus native edit/no-auto-create.
AC4: real installed FFmpeg fixtures, independently decoded with omggif; tests
intercept CDN core URLs using installed assets, proving codec behavior rather than
unpkg availability. AC5: native keyboard/mobile flow and Pages prefix build/smoke.
Rich progress, per-frame timing and quality/file-size optimization remain separate.
