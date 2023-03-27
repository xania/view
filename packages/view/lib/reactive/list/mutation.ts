export type ListMutation<T> = ListAddMutation<T> | ListRemoveMutation;

interface ListAddMutation<T> {
  type: 'add';
  item: T;
}

interface ListRemoveMutation {
  type: 'remove';
  index: number;
}

export function listAdd<T>(item: T): ListAddMutation<T> {
  return {
    type: 'add',
    item,
  };
}

export function listRemove<T>(index: number): ListRemoveMutation {
  return {
    type: 'remove',
    index,
  };
}
