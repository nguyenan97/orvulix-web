/** Native clipboard only: no deprecated fallback or permission probing. */
export async function writeResultText(text: string): Promise<void> {
  if (globalThis.isSecureContext === false || !navigator.clipboard?.writeText)
    throw Error(
      'Clipboard unavailable. Use HTTPS or select the result and copy it manually.'
    );
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    throw Error(
      'Clipboard access failed. Allow clipboard access or select the result and copy it manually.'
    );
  }
}
