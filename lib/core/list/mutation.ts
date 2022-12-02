export enum ListMutationType {
  Append,
  DeleteAt,
  Flush,
  Filter,
  Insert,
  Clear,
  Concat,
  Truncate,
  Move,
}

interface ListClearMutation {
  type: ListMutationType.Clear;
}

interface ListAppendMutation<T> {
  type: ListMutationType.Append;
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

interface ListFlushMutation<T> {
  type: ListMutationType.Flush;
  items: T[];
}

interface ListFilterMutation<T> {
  type: ListMutationType.Filter;
  predicate: (t: T) => boolean;
}

interface ListConcatMutation<T> {
  type: ListMutationType.Concat;
  values: T[];
}

interface ListTruncateMutation {
  type: ListMutationType.Truncate;
  length: number;
}

interface ListMoveMutation {
  type: ListMutationType.Move;
  from: number;
  to: number;
}

export type ListMutation<T> =
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListFlushMutation<T>
  | ListFilterMutation<T>
  | ListInsertMutation<T>
  | ListClearMutation
  | ListConcatMutation<T>
  | ListTruncateMutation
  | ListMoveMutation;

/*
  
enum ArrayMutationType {
  Move,
  Insert,
  Concat,
  Truncate,
  RemoveAt,
}

interface MoveMutation<T> {
  type: ArrayMutationType.Move;
  value: T;
  from: number;
  to: number;
}

interface InsertMutation<T> {
  type: ArrayMutationType.Insert;
  value: T;
  index: number;
}

interface PushMutation<T> {
  type: ArrayMutationType.Concat;
  values: T[];
}

interface TruncateMutation {
  type: ArrayMutationType.Truncate;
  length: number;
}

interface RemoveAtMutation {
  type: ArrayMutationType.RemoveAt;
  index: number;
}

type ArrayMutation<T> =
  | MoveMutation<T>
  | PushMutation<T>
  | InsertMutation<T>
  | RemoveAtMutation
  | TruncateMutation;

  */
