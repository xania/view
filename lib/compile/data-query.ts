export enum QueryType {
  Index,
  Filter,
}
interface DataIndexQuery {
  type: QueryType.Index;
  index: number;
}

interface DataFilterQuery<T> {
  type: QueryType.Filter;
  filter: (index: number, data: T) => boolean;
}

export type DataQuery<T = any> = DataIndexQuery | DataFilterQuery<T>;
