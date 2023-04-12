export interface DataSource<T> {
  data: T[];
  offset: number;
  length: number;
}
