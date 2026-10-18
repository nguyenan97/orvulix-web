# PDF conversion ownership

Status: accepted for review R05/R06/R10.

PNG and EPUB share loading-task ownership and current-job UI semantics. Introduce
one PDF-specific bounded document operation and one hook based on usePdfMerge,
keeping codecs/export formats at their existing services. Both service APIs gain
an optional AbortSignal. PNG removes its unused URL field; its only route consumer
creates Files once on successful conversion rather than on every render.

Keeping two independent implementations was simpler initially but duplicates the
same cancellation/teardown defect. A global task framework was rejected because
other tools have different ownership and abort capabilities. These helpers apply
only to these two PDF converters. Admission limits are explicit in UI/checkpoint.

Shared multi-file previews own URLs in an effect per file. Downloads retain their
separate short-lived URLs. No side effects occur during rendering. Unknown file
types need no preview URL. Existing consumers need no API change.

Rollback restores service/route adapters and preview rendering together, losing
the lifecycle protections. Upstream hotspots: two PDF services/routes and the
small ToolMultiFileResult preview slot. No dependency/network/hosting migration.
