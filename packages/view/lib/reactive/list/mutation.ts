import { ListSource } from '.';
import { RenderContext } from '../../render/render-context';
import { Command } from '../commands';
import { State } from '../state';

export type ListMutation<T> =
  | AddRowMutation<T>
  | FilterRowMutation<T>
  | DisposeRowMutation
  | RemoveRowMutation
  | EachRowMutation<T>;

interface AddRowMutation<T> {
  type: 'add';
  itemOrGetter: T | ((arr: T[]) => T);
}

interface FilterRowMutation<T> {
  type: 'filter';
  list: State<T[]>;
  filter: (item: T) => boolean;
}

interface DisposeRowMutation {
  type: 'dispose';
  list: State;
  context: RenderContext;
}

interface RemoveRowMutation {
  type: 'remove';
  index: number;
}

interface EachRowMutation<T> {
  type: 'each';
  list: State<T[]>;
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
