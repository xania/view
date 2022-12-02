export enum ListMutationType {
  Append,
  DeleteAt,
  Flush,
  Filter,
  Insert,
  Clear,
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

export type ListMutation<T> =
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListFlushMutation<T>
  | ListFilterMutation<T>
  | ListInsertMutation<T>
  | ListClearMutation;
