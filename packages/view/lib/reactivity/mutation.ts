import { Command, Signal } from '../../reactivity';

export type ListMutation<T> =
  | AddRowMutation<T>
  | InsertRowMutation<T>
  | FilterRowMutation<T>
  // | DisposeRowMutation
  | RemoveRowMutation
  | EachRowMutation<T>
  | AppendRowsMutation<T>
  | MoveRowMutation
  | ResetMutation<T>;

interface ResetMutation<T> {
  type: 'reset';
  items: T[];
}

interface MoveRowMutation {
  type: 'move';
  from: number;
  to: number;
}

export type AddRowMutation<T> =
  | {
      type: 'add';
      func: (arr: T[]) => T;
    }
  | {
      type: 'add';
      value: T;
    };

interface InsertRowMutation<T> {
  type: 'insert';
  item: T;
  index: number;
}

interface AppendRowsMutation<T> {
  type: 'append';
  items: T[];
}

interface FilterRowMutation<T> {
  type: 'filter';
  list: Signal<T[]>;
  filter: (item: T) => boolean;
}

// interface DisposeRowMutation {
//   type: 'dispose';
//   list: State;
//   context: RenderContext;
// }

interface RemoveRowMutation {
  type: 'remove';
  index: number;
}

interface EachRowMutation<T> {
  type: 'each';
  list: Signal<T[]>;
  command: Command;
}

export function isListMutation(value: any): value is ListMutation<any> {
  if (value === null || value === undefined || value.type === undefined) {
    return false;
  }

  if (value.type === 'add' || value.type === 'remove') {
    return true;
  }
  return false;
}
