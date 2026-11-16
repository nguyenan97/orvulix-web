// Test fixtures only; never imported by production worker/UI.
import type { ListOperation } from './contracts';
export interface Fixture {
  operation: ListOperation;
  route: string;
  input: string;
  values: Record<string, unknown>;
  expected: string;
}
const base = {
  splitOperatorType: 'regex',
  splitSeparator: ',',
  joinSeparator: '|'
};
export const fixtures: Fixture[] = [
  {
    operation: 'wrap',
    route: 'wrap',
    input: 'c,a,b,a',
    values: { ...base, deleteEmptyItems: false, left: '[', right: ']' },
    expected: '[c]|[a]|[b]|[a]'
  },
  {
    operation: 'unwrap',
    route: 'unwrap',
    input: '[[c]], [a],[b],[a]',
    values: {
      ...base,
      deleteEmptyItems: true,
      left: '[',
      right: ']',
      multiLevel: true,
      trimItems: true
    },
    expected: 'c|[a|b|a'
  },
  {
    operation: 'rotate',
    route: 'rotate',
    input: 'c,a,b,a',
    values: { ...base, right: true, step: 1 },
    expected: 'a|c|a|b'
  },
  {
    operation: 'truncate',
    route: 'truncate',
    input: 'c,a,b,a',
    values: { ...base, end: true, length: '2' },
    expected: 'c|a'
  },
  {
    operation: 'group',
    route: 'chunk',
    input: 'c,a,b,a',
    values: {
      ...base,
      groupSeparator: '|',
      groupNumber: 2,
      itemSeparator: ';',
      leftWrap: '[',
      rightWrap: ']',
      deleteEmptyItems: true,
      padNonFullGroup: false,
      paddingChar: '_'
    },
    expected: '[c;a]|[b;a]'
  },
  {
    operation: 'sort',
    route: 'sort',
    input: 'c,a,b,a',
    values: {
      ...base,
      splitOperatorType: undefined,
      splitSeparatorType: 'regex',
      sortingMethod: 'alphabetic',
      increasing: true,
      removeDuplicated: true,
      caseSensitive: false
    },
    expected: 'a|b|c'
  },
  {
    operation: 'find-unique',
    route: 'find-unique',
    input: 'c,a,b,a',
    values: {
      ...base,
      deleteEmptyItems: true,
      trimItems: true,
      caseSensitive: false,
      absolutelyUnique: true
    },
    expected: 'c|b'
  },
  {
    operation: 'duplicate',
    route: 'duplicate',
    input: 'c,a,b,a',
    values: { ...base, concatenate: true, reverse: false, copy: '1.5' },
    expected: 'c|a|b|a|c|a'
  },
  {
    operation: 'find-most-popular',
    route: 'find-most-popular',
    input: 'c,a,b,a',
    values: {
      ...base,
      splitOperatorType: undefined,
      splitSeparatorType: 'regex',
      sortingMethod: 'count',
      displayFormat: 'percentage',
      deleteEmptyItems: true,
      ignoreItemCase: false,
      trimItems: true
    },
    expected: 'a: 2 (50.00%)\nc: 1 (25.00%)\nb: 1 (25.00%)'
  }
];
