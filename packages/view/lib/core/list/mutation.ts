export enum ListMutationType {
  Push,
  DeleteAt,
  Delete,
  Flush,
  Filter,
  Insert,
  Clear,
  Concat,
  Truncate,
  Move,
  Update,
}

export interface ListUpdateMutation<T> {
  type: ListMutationType.Update;
  items: ArrayLike<T>;
}

export interface ListClearMutation<T> {
  type: ListMutationType.Clear;
  firstItem: T;
  lastItem: T;
}

interface ListAppendMutation<T> {
  type: ListMutationType.Push;
  item: T;
}

interface ListInsertMutation<T> {
  type: ListMutationType.Insert;
  item: T;
  index: number;
}

interface ListDeleteAtMutation {
  type: ListMutationType.DeleteAt;
  index: number;
}

export interface ListDeleteMutation<T> {
  type: ListMutationType.Delete;
  item: T;
}

interface ListFilterMutation<T> {
  type: ListMutationType.Filter;
  predicate: (t: T) => boolean;
}

interface ListConcatMutation<T> {
  type: ListMutationType.Concat;
  items: ArrayLike<T>;
}

interface ListTruncateMutation {
  type: ListMutationType.Truncate;
  length: number;
}

export interface ListMoveMutation<T> {
  type: ListMutationType.Move;
  item: T;
  beforeItem: T;
}

export type ListMutation<T> =
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListDeleteMutation<T>
  | ListFilterMutation<T>
  | ListInsertMutation<T>
  | ListClearMutation<T>
  | ListConcatMutation<T>
  | ListTruncateMutation
  | ListMoveMutation<T>
  | ListUpdateMutation<T>;
