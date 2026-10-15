/**
 * Monaco's WebKit workaround listens on an ancestor and calls clipboard.write
 * on every click/keydown. Keep unsupported result gestures local; do not prevent
 * the control's default action, editor handlers or native user activation.
 */
export function guardCodeResultGesture(event: { stopPropagation(): void }) {
  if (globalThis.isSecureContext === false || !navigator.clipboard?.write)
    event.stopPropagation();
}
