import { convertDelimited } from '../../../../features/delimited-json/convert';
import type { InitialValuesType } from './types';

export function convertTsvToJson(
  input: string,
  options: InitialValuesType
): string {
  return input ? convertDelimited(input, options) : '';
}
