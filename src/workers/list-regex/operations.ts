import { wrapList } from '../../pages/tools/list/wrap/service';
import { unwrapList } from '../../pages/tools/list/unwrap/service';
import { rotateList } from '../../pages/tools/list/rotate/service';
import { truncateList } from '../../pages/tools/list/truncate/service';
import { chunkList } from '../../pages/tools/list/group/service';
import { Sort } from '../../pages/tools/list/sort/service';
import { findUniqueCompute } from '../../pages/tools/list/find-unique/service';
import { duplicateList } from '../../pages/tools/list/duplicate/service';
import { TopItemsList } from '../../pages/tools/list/find-most-popular/service';
import { shuffleList } from '../../pages/tools/list/shuffle/service';
import { reverseList } from '../../pages/tools/list/reverse/service';
import { isNumber } from './pure-string';
import type { OperationOptions } from './contracts';
type Handlers = {
  [K in keyof OperationOptions]: (
    input: string,
    options: OperationOptions[K]
  ) => string;
};
/** Typed adapters call the original services with their original argument/parsing order. */
export const operations: Handlers = {
  shuffle: (input, o) =>
    shuffleList(
      'regex',
      input,
      o.splitSeparator,
      o.joinSeparator,
      o.length !== undefined && isNumber(o.length)
        ? Number(o.length)
        : undefined
    ),
  reverse: (input, o) =>
    reverseList('regex', o.splitSeparator, o.joinSeparator, input),
  wrap: (input, o) =>
    wrapList(
      'regex',
      input,
      o.splitSeparator,
      o.joinSeparator,
      o.deleteEmptyItems,
      o.left,
      o.right
    ),
  unwrap: (input, o) =>
    unwrapList(
      'regex',
      input,
      o.splitSeparator,
      o.joinSeparator,
      o.deleteEmptyItems,
      o.multiLevel,
      o.trimItems,
      o.left,
      o.right
    ),
  rotate: (input, o) =>
    rotateList(
      'regex',
      input,
      o.splitSeparator,
      o.joinSeparator,
      o.right,
      o.step
    ),
  truncate: (input, o) =>
    truncateList(
      'regex',
      input,
      o.splitSeparator,
      o.joinSeparator,
      o.end,
      parseInt(o.length, 10)
    ),
  group: (input, o) =>
    chunkList(
      'regex',
      o.splitSeparator,
      input,
      o.groupNumber,
      o.itemSeparator,
      o.leftWrap,
      o.rightWrap,
      o.joinSeparator,
      o.deleteEmptyItems,
      o.padNonFullGroup,
      o.paddingChar
    ),
  sort: (input, o) =>
    Sort(
      o.sortingMethod,
      'regex',
      input,
      o.increasing,
      o.splitSeparator,
      o.joinSeparator,
      o.removeDuplicated,
      o.caseSensitive
    ),
  'find-unique': (input, o) =>
    findUniqueCompute(
      'regex',
      o.splitSeparator,
      o.joinSeparator,
      input,
      o.deleteEmptyItems,
      o.trimItems,
      o.caseSensitive,
      o.absolutelyUnique
    ),
  duplicate: (input, o) =>
    duplicateList(
      'regex',
      o.splitSeparator,
      o.joinSeparator,
      input,
      o.concatenate,
      o.reverse,
      parseFloat(o.copy)
    ),
  'find-most-popular': (input, o) =>
    TopItemsList(
      'regex',
      o.sortingMethod,
      o.displayFormat,
      o.splitSeparator,
      input,
      o.deleteEmptyItems,
      o.ignoreItemCase,
      o.trimItems
    )
};
