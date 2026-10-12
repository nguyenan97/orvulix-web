import type { ListOperation, ListRequest, SplitOptions } from './contracts';
export const OPERATIONS: readonly ListOperation[] = [
  'shuffle',
  'reverse',
  'wrap',
  'unwrap',
  'rotate',
  'truncate',
  'group',
  'sort',
  'find-unique',
  'duplicate',
  'find-most-popular'
];
/** Project Formik data into a small typed contract; no arbitrary fields enter the worker. */
export function createRequest(
  operation: ListOperation,
  values: Record<string, unknown>,
  input: string
): ListRequest {
  const string = (key: string): string => {
    const v = values[key];
    if (typeof v !== 'string') throw Error(`Invalid ${key}.`);
    return v;
  };
  const boolean = (key: string): boolean => {
    const v = values[key];
    if (typeof v !== 'boolean') throw Error(`Invalid ${key}.`);
    return v;
  };
  const number = (key: string): number => {
    const v = values[key];
    if (typeof v !== 'number' || !Number.isFinite(v))
      throw Error(`Invalid ${key}.`);
    return v;
  };
  const oneOf = <T extends string>(key: string, choices: readonly T[]): T => {
    const v = string(key);
    const value = choices.find((c) => c === v);
    if (value === undefined) throw Error(`Invalid ${key}.`);
    return value;
  };
  const base: SplitOptions = {
    splitOperatorType: 'regex',
    splitSeparator: string('splitSeparator'),
    joinSeparator:
      operation === 'group'
        ? string('groupSeparator')
        : operation === 'find-most-popular'
          ? '\n'
          : string('joinSeparator')
  };
  const wrap = () => ({
    ...base,
    deleteEmptyItems: boolean('deleteEmptyItems'),
    left: string('left'),
    right: string('right')
  });
  switch (operation) {
    case 'shuffle':
      return {
        operation,
        input,
        options: {
          ...base,
          ...(values.length === undefined ? {} : { length: string('length') })
        }
      };
    case 'reverse':
      return { operation, input, options: base };
    case 'wrap':
      return { operation, input, options: wrap() };
    case 'unwrap':
      return {
        operation,
        input,
        options: {
          ...wrap(),
          multiLevel: boolean('multiLevel'),
          trimItems: boolean('trimItems')
        }
      };
    case 'rotate':
      return {
        operation,
        input,
        options: { ...base, right: boolean('right'), step: number('step') }
      };
    case 'truncate':
      return {
        operation,
        input,
        options: { ...base, end: boolean('end'), length: string('length') }
      };
    case 'group':
      return {
        operation,
        input,
        options: {
          ...base,
          groupNumber: number('groupNumber'),
          itemSeparator: string('itemSeparator'),
          leftWrap: string('leftWrap'),
          rightWrap: string('rightWrap'),
          deleteEmptyItems: boolean('deleteEmptyItems'),
          padNonFullGroup: boolean('padNonFullGroup'),
          paddingChar: string('paddingChar')
        }
      };
    case 'sort':
      return {
        operation,
        input,
        options: {
          ...base,
          sortingMethod: oneOf('sortingMethod', [
            'numeric',
            'alphabetic',
            'length'
          ]),
          increasing: boolean('increasing'),
          removeDuplicated: boolean('removeDuplicated'),
          caseSensitive: boolean('caseSensitive')
        }
      };
    case 'find-unique':
      return {
        operation,
        input,
        options: {
          ...base,
          deleteEmptyItems: boolean('deleteEmptyItems'),
          trimItems: boolean('trimItems'),
          caseSensitive: boolean('caseSensitive'),
          absolutelyUnique: boolean('absolutelyUnique')
        }
      };
    case 'duplicate':
      return {
        operation,
        input,
        options: {
          ...base,
          concatenate: boolean('concatenate'),
          reverse: boolean('reverse'),
          copy: string('copy')
        }
      };
    case 'find-most-popular':
      return {
        operation,
        input,
        options: {
          ...base,
          sortingMethod: oneOf('sortingMethod', ['count', 'alphabetic']),
          displayFormat: oneOf('displayFormat', [
            'count',
            'percentage',
            'total'
          ]),
          deleteEmptyItems: boolean('deleteEmptyItems'),
          ignoreItemCase: boolean('ignoreItemCase'),
          trimItems: boolean('trimItems')
        }
      };
  }
}
