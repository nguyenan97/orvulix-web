# Ghostscript worker settlement

Status: accepted for R07.

Two callers migrate together from URL/XHR messages to transferred input/output
ArrayBuffers. Worker sends explicit success bytes or a controlled error. Parent
owns a fresh worker, listeners, deadline and optional abort signal per request.
Terminate on every settlement. Parent validates response shape/header/size before
creating a File; generated Ghostscript codec stays unchanged.

Keeping URLs and adding XHR error handlers was simpler locally but retains two
extra asynchronous fetches and split URL ownership across terminated workers.
Transferred bytes remove that failure/resource boundary. No generic worker runtime
is introduced. R09 password privacy remains a required regression.

Migration touches worker-init/background-worker and compression/protection services
and route job ownership. Other PDF services are unaffected. Rollback must restore
both sides of this private protocol together. Upstream hotspots are those adapters;
no dependency or hosting change. The existing WASM asset still downloads remotely.
