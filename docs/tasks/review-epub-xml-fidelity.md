# Task checkpoint: review-epub-xml-fidelity

- Updated: 2026-10-18, Asia/Bangkok
- Branch / base: feature/review-epub-xml-fidelity / develop 22e2a097
- PR: pending
- Phase: reviewing
- Delivery mode: develop-merge
- Authorization: fix all confirmed findings; this slice addresses R02.
- Last verified tree: base plus uncommitted regression/spec.

## Scope and acceptance

Filename/PDF extracted text currently becomes raw XML/XHTML and breaks EPUB or
changes literal text into markup. Encode only XML text contexts, reject XML 1.0
illegal characters rather than silently deleting data. Preserve chapter ordering,
paragraph behavior, filenames, MIME, manifest/spine and local processing.

- AC1: name R&D <draft>.pdf and text A & B <b>literal</b> produce well-formed
  OPF/NCX/XHTML and exact literal text after XML parsing.
- AC2: Unicode/astral characters and quotes survive; input cannot create active
  markup. Illegal XML characters have a controlled failure.
- AC3: actual production-browser EPUB download unzips/parses correctly. Mocked
  PDF text extraction unit tests do not prove extraction or ZIP/browser fidelity.

Risk: PDF/filename -> exported XML text boundary. Use existing JSZip/XML/browser
tools, no dependency or reader sandbox change. EPUB readers themselves are outside
scope. Resource/job ownership remains R05/R06, tracked in the overall review.

## Resume

Five regressions failed on baseline for malformed metadata/raw markup/illegal XML
characters. Five pass after text-context encoding, including Unicode/astral text.
Production build/typecheck, read-only scoped ESLint, style and 26 security tests
plus unchanged audit gate pass. Real downloaded two-page EPUB unzips/parses with
correct text/title/chapter ordering and no active elements on Chromium, Firefox,
WebKit: 3/3 passed, retries zero, 390x844. Evidence r02-browser.json outside repo.

Standards/requirements self-review: escape full extracted page text before trim,
so illegal characters cannot disappear silently; encode only &, <, > for XML text
contexts, retain quotes. Metadata/NCX share one book ID. Preserve existing output
and paragraph contracts. No new dependency/network boundary or active app DOM.
No open blocking finding for this slice. Self-review is not independent approval.
Upstream hotspots: pdf-to-epub/service.ts and the focused Pages test entry.

Next: refresh develop when R09 delivers; it changes independent Ghostscript files.
Commit/push/open one PR, then final-head full CI and merge/cleanup under R01 gates.
The current runtime tree is validated; this checkpoint update is docs only.
