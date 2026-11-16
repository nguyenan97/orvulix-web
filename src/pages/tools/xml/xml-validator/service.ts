import { InitialValuesType } from './types';
import { XMLValidator } from 'fast-xml-parser';

export function validateXml(
  input: string,
  _options: InitialValuesType
): string {
  // Retain the options argument for existing callers; no options are supported.
  void _options;
  const result = XMLValidator.validate(input);
  if (result === true) {
    return 'Valid XML';
  } else if (typeof result === 'object' && result.err) {
    return `Invalid XML: ${result.err.msg} (line ${result.err.line}, col ${result.err.col})`;
  } else {
    return 'Invalid XML: Unknown error';
  }
}
