/** Windows native clipboard storage uses CRLF. Application write arguments and
 * downloaded bytes are asserted separately, without this platform conversion.
 */
export const nativeClipboardText = (text: string) =>
  process.platform === 'win32' ? text.replace(/\r?\n/g, '\r\n') : text;
