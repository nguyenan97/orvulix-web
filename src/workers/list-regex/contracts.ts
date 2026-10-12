import type { SortingMethod as SortMethod } from '../../pages/tools/list/sort/service';
import type {
  SortingMethod as PopularMethod,
  DisplayFormat
} from '../../pages/tools/list/find-most-popular/service';
export interface SplitOptions {
  splitOperatorType: 'regex';
  splitSeparator: string;
  joinSeparator: string;
}
interface WrapOptions extends SplitOptions {
  deleteEmptyItems: boolean;
  left: string;
  right: string;
}
export interface OperationOptions {
  shuffle: SplitOptions & { length?: string };
  reverse: SplitOptions;
  wrap: WrapOptions;
  unwrap: WrapOptions & { multiLevel: boolean; trimItems: boolean };
  rotate: SplitOptions & { right: boolean; step: number };
  truncate: SplitOptions & { end: boolean; length: string };
  group: SplitOptions & {
    groupNumber: number;
    itemSeparator: string;
    leftWrap: string;
    rightWrap: string;
    deleteEmptyItems: boolean;
    padNonFullGroup: boolean;
    paddingChar: string;
  };
  sort: SplitOptions & {
    sortingMethod: SortMethod;
    increasing: boolean;
    removeDuplicated: boolean;
    caseSensitive: boolean;
  };
  'find-unique': SplitOptions & {
    deleteEmptyItems: boolean;
    trimItems: boolean;
    caseSensitive: boolean;
    absolutelyUnique: boolean;
  };
  duplicate: SplitOptions & {
    concatenate: boolean;
    reverse: boolean;
    copy: string;
  };
  'find-most-popular': SplitOptions & {
    sortingMethod: PopularMethod;
    displayFormat: DisplayFormat;
    deleteEmptyItems: boolean;
    ignoreItemCase: boolean;
    trimItems: boolean;
  };
}
export type ListOperation = keyof OperationOptions;
export type ListRequest = {
  [K in ListOperation]: {
    operation: K;
    input: string;
    options: OperationOptions[K];
  };
}[ListOperation];
