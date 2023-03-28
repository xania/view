export type ListMutation<T> = ListAddMutation<T> | ListRemoveMutation;

interface ListAddMutation<T> {
  type: 'add';
  itemOrGetter: T | ((arr: T[]) => T);
}

interface ListRemoveMutation {
  type: 'remove';
  index: number;
}

export function listRemove<T>(index: number): ListRemoveMutation {
  return {
    type: 'remove',
    index,
  };
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
