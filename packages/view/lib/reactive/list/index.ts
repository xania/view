﻿import { ListMutationCommand } from '../commands';
import { State, Stateful } from '../state';

export function List<T>(props: ListExpression<T>) {
  return new ListExpression<T>(props.source, props.children);
}

export class ListExpression<T = any> {
  constructor(
    public source: Stateful<T[]> | T[],
    public children: (
      item: State<T>,
      dispose: ListMutationCommand
    ) => JSX.Children
  ) {}
}

export function listSource<T>(value?: JSX.MaybePromise<T[]>) {
  return new ListSource(value);
}

class ListSource<T> extends State<T[]> {
  push<T>(itemOrGetter: T | ((arr: T[]) => T)) {
    return new ListMutationCommand(this, {
      type: 'add',
      itemOrGetter,
    });
  }
}
