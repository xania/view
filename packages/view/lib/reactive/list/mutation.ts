﻿import { ListSource } from '.';
import { RenderContext } from '../../render/render-context';

export type ListMutation<T> =
  | AddRowMutation<T>
  | FilterRowMutation<T>
  | DisposeRowMutation
  | RemoveRowMutation;

interface AddRowMutation<T> {
  type: 'add';
  itemOrGetter: T | ((arr: T[]) => T);
}

interface FilterRowMutation<T> {
  type: 'filter';
  filter: (item: T) => boolean;
}

interface DisposeRowMutation {
  type: 'dispose';
  list: ListSource;
  context: RenderContext;
}

interface RemoveRowMutation {
  type: 'remove';
  index: number;
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
