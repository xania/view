import { State } from '../state';

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: State<T[]> | T[],
    public children: (item: State<T>) => JSX.Children
  ) {}
}
