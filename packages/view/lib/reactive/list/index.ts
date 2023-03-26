import { State } from '../state';
import { ListSource } from './source';

export interface ListProps<T> {
  source: ListSource<T> | State<T[]> | T[];
  children: (item: State<T>) => JSX.Children;
}

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: ListSource<T> | State<T[]> | T[],
    public children: (item: State<T>) => JSX.Children
  ) {}
}
