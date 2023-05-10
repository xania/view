import { AddRowMutation, ListMutation } from './mutation';
import { Computed, Reactive } from './reactive';
import { Sandbox } from './sandbox';
import { State } from './state';

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: ListMutations<T> | Reactive<T[]> | T[],
    public children: JSX.Sequence<(item: Reactive<T>) => JSX.Element>
  ) {}
}

export function diff<T>(source: Reactive<T[]>) {
  return new ListMutations(source);
}

export class ListMutations<T> extends Computed<T[], ListMutation<T>[]> {
  constructor(public source: Reactive<T[]>) {
    super(source, (items) => [{ type: 'reset', items }]);
  }

  add(itemOrGetter: AddRowMutation<T>['itemOrGetter']) {
    return [{ type: 'add', itemOrGetter } satisfies ListMutation<T>];
  }
}

export class ListItem<T> extends Reactive<T> {
  public items: T[] = [];

  constructor(public listState: ListMutations<T>, public readonly key: symbol) {
    super();
  }
}
