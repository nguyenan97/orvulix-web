import { shuffleList } from '../../pages/tools/list/shuffle/service';
import { reverseList } from '../../pages/tools/list/reverse/service';
import { checkOutput, checkRequest, type ListRequest } from './model';

/** Only the worker calls this in production. Reuse original service semantics. */
export function executeList(request: ListRequest): string {
  checkRequest(request);
  const { splitSeparator, joinSeparator, length } = request.options;
  const numericLength =
    length !== undefined &&
    !Number.isNaN(parseFloat(length)) &&
    Number.isFinite(Number(length))
      ? Number(length)
      : undefined;
  let result: string;
  try {
    result =
      request.operation === 'shuffle'
        ? shuffleList(
            'regex',
            request.input,
            splitSeparator,
            joinSeparator,
            numericLength
          )
        : reverseList('regex', splitSeparator, joinSeparator, request.input);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`Invalid regular expression: ${error.message}`);
    throw error;
  }
  checkOutput(result);
  return result;
}
