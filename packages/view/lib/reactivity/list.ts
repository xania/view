import { ListMutation } from './mutation';
import { Computed, Reactive } from './reactive';

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

  add(itemOrGetter: T | ((x: T[]) => T)) {
    if (itemOrGetter instanceof Function) {
      return [{ type: 'add', func: itemOrGetter } satisfies ListMutation<T>];
    } else {
      return [{ type: 'add', value: itemOrGetter } satisfies ListMutation<T>];
    }
  }
}

export class ListItem<T> extends Reactive<T> {
  public items: T[] = [];

  constructor(public listState: ListMutations<T>, public readonly key: symbol) {
    super();
  }
}
