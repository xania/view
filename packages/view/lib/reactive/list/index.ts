import { Graph, RenderContext } from '../../render/render-context';
import { Command, ListMutationCommand } from '../commands';
import { State, Stateful } from '../state';

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: State<T[]> | T[],
    public children: (item: State<T>, dispose: Command) => JSX.Element
  ) {}
}

export function listSource<T>(value?: JSX.MaybePromise<T[]>) {
  return new ListSource(value);
}

export class ListSource<T = any> extends State<T[]> {
  // public itemKey: number = this.key + 1;
  // public childrenKey: number = this.key + 2;

  push(itemOrGetter: T | ((arr: T[]) => T)): ListMutationCommand<T> {
    return new ListMutationCommand(this, {
      type: 'add',
      itemOrGetter,
    });
  }

  filter(f: (item: T) => boolean) {
    return new ListMutationCommand(this, {
      type: 'filter',
      list: this,
      filter: f,
    });
  }
}

export class ItemState<T = any> extends State<T> {
  constructor(public listContext: RenderContext, public list: State<T[]>) {
    super();
    this.key = list.key + ITEM_KEY_OFFSET;
  }
}

export const ITEM_KEY_OFFSET = 1;
export const CHILDREN_KEY_OFFSET = 2;
