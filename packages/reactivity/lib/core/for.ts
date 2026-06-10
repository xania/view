import type { ItemState, Lense, Scope, State } from '../state';

type BodyFun<T> = (e: Lense<T>) => any;

export type ForEachBody<T = any> =
  | string
  | BodyFun<T>
  | State<any>
  | number
  | boolean
  | Record<any, any>;

export class ForEachComponent<T> {
  constructor(
    public expr: Lense<T[]>,
    public initial: T[] | void,
    public body: ForEachBody<T>
  ) {}
}

export function ForEach<T>(expr: Lense<T[]>, body: ForEachBody<T>) {
  const { initial } = expr;

  const actions = expr.map(reconcile);

  if (initial instanceof Promise) {
    throw new Error('not yet implemeted');
  }
  return new ForEachComponent(actions, initial, body);
}

export class Iterator<T> {
  constructor(
    public body: any,
    public scope: Scope,
    public itemState?: ItemState<T>
  ) {}
}

function reconcile<T>(next: T[], prev?: T[]) {
  if (!prev) {
    return next;
  }
  return next;
}
