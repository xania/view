import { AddRowMutation, ListMutation } from './mutation';
import { Computed, State } from './state';

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: ListMutationState<T> | State<T[]> | T[],
    public children: JSX.Sequence<(item: State<T>) => JSX.Element>
  ) {}
}

export function diff<T>(source: State<T[]>) {
  return new ListMutationState(source);
}

export class ListMutationState<T> extends Computed<T[], ListMutation<T>[]> {
  constructor(public source: State<T[]>) {
    super(source, (items) => [{ type: 'reset', items }]);
  }

  add(itemOrGetter: AddRowMutation<T>['itemOrGetter']) {
    return [{ type: 'add', itemOrGetter } satisfies ListMutation<T>];
  }
}

interface IfProps {
  condition: State<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
  return new ListExpression(
    new ListMutationState(props.condition.map((b) => (b ? [{}] : []))),
    props.children
  );
}
