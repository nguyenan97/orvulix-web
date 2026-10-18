import { replaceText } from '../../pages/tools/string/text-replacer/service';
import { compute } from '../../pages/tools/string/split/service';
import { palindromeList } from '../../pages/tools/string/palindrome/service';
import { checkOutput, checkRequest, type StringRequest } from './model';

/** Worker-only entry point. Keep native replacement/flags/substitution semantics. */
export function executeString(request: StringRequest): string {
  checkRequest(request);
  if (!request.input) return '';
  let result: string;
  if (request.tool === 'replace') {
    const { options } = request;
    if (options.mode === 'regexp' && options.searchRegexp.trim()) {
      const literal = options.searchRegexp.match(/^\/(.*)\/([a-z]*)$/i);
      // Validate syntax here, before the legacy service can silently return input.
      new RegExp(
        literal ? literal[1] : options.searchRegexp,
        literal ? literal[2] : 'g'
      );
    }
    result = replaceText(options, request.input);
  } else if (request.tool === 'split') {
    const options = request.options;
    result = compute(
      options.splitSeparatorType,
      request.input,
      options.symbolValue,
      options.regexValue,
      Number(options.lengthValue),
      Number(options.chunksValue),
      options.charBeforeChunk,
      options.charAfterChunk,
      options.outputSeparator
    );
  } else {
    const options = request.options;
    result = palindromeList(
      options.splitOperatorType,
      request.input,
      options.splitOperatorType === 'regex'
        ? options.regexValue
        : options.symbolValue
    );
  }
  checkOutput(result);
  return result;
}
