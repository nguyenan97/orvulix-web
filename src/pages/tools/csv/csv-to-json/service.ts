import {
  convertDelimited,
  type DelimitedOptions
} from '../../../../features/delimited-json/convert';

export function convertCsvToJson(
  source: string,
  options: Partial<DelimitedOptions> = {}
): string {
  return convertDelimited(source, {
    delimiter: ',',
    quote: String.fromCharCode(34),
    comment: '#',
    useHeaders: true,
    skipEmptyLines: true,
    dynamicTypes: true,
    ...options
  });
}
