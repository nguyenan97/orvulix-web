import { operations } from './operations';
import { checkOutput, checkRequest, type ListRequest } from './model';

export function executeList(request: ListRequest): string {
  checkRequest(request);
  let result: string;
  try {
    switch (request.operation) {
      case 'shuffle':
        result = operations['shuffle'](request.input, request.options);
        break;
      case 'reverse':
        result = operations['reverse'](request.input, request.options);
        break;
      case 'wrap':
        result = operations['wrap'](request.input, request.options);
        break;
      case 'unwrap':
        result = operations['unwrap'](request.input, request.options);
        break;
      case 'rotate':
        result = operations['rotate'](request.input, request.options);
        break;
      case 'truncate':
        result = operations['truncate'](request.input, request.options);
        break;
      case 'group':
        result = operations['group'](request.input, request.options);
        break;
      case 'sort':
        result = operations['sort'](request.input, request.options);
        break;
      case 'find-unique':
        result = operations['find-unique'](request.input, request.options);
        break;
      case 'duplicate':
        result = operations['duplicate'](request.input, request.options);
        break;
      case 'find-most-popular':
        result = operations['find-most-popular'](
          request.input,
          request.options
        );
        break;
    }
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`Invalid regular expression: ${error.message}`);
    throw error;
  }
  checkOutput(result);
  return result;
}
