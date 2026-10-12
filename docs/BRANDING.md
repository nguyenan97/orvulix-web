# Orvulix branding and factual product descriptions

Keep `src/brand/config.ts` as the source for product name, download prefix,
default watermark and general processing notice. Shared result components use
the download prefix; watermark and EPUB tools have small marked integrations.
Retain these integrations when merging OmniTools updates. User-entered content
and sample URLs are not automatically renamed.

`public/favicon.svg` remains the brand source and its public URL is unchanged.
To regenerate fallback/device icons, install the existing dev dependencies and
Chromium, then run `node scripts/brand-icons.mjs`. Generated assets are committed;
normal builds do not require Chromium. Manifest icons work on Netlify and are
prefixed by the Pages development artifact preparation script.

The inherited English `hero.brand` and `hero.description` locale keys still
describe OmniTools. The current Hero does not read them: it uses `brand` instead.
Do not edit all upstream translations solely to change unused strings. If an
upstream merge restores those keys in visible UI, adapt the branding integration
and recheck it. Preserve LICENSE, THIRD_PARTY_NOTICES and source attribution.

Avoid universal privacy promises. A CDN download and an input upload are
different operations; audit each tool's requests and implementation before
claiming local-only processing. Keep current functionality separate from planned
Claude features. Do not invent user metrics, commercial plans, incorporation,
program eligibility or reasons for rejection from repository history.

The review of a startup-program application requires the actual application,
response and current official terms. A working prototype and measured usage may
help communicate product value, but their absence here does not establish a
rejection reason. No analytics or external AI service is added by this change.
