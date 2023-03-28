export type ListMutation<T> =
  | AddRowMutation<T>
  | DisposeRowMutation
  | RemoveRowMutation;

interface AddRowMutation<T> {
  type: 'add';
  itemOrGetter: T | ((arr: T[]) => T);
}

interface DisposeRowMutation {
  type: 'dispose';
  source: any;
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
