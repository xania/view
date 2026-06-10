import type { Scope, State } from '../state';

type BodyFun<T> = (e: State<T>) => any;

export type ForEachBody<T = any> =
  | string
  | BodyFun<T>
  | State<any>
  | number
  | boolean
  | Record<any, any>;

export class ForEachComponent<T> {
  constructor(
    public expr: State<T[], any>,
    public initial: T[] | void,
    public body: ForEachBody<T>
  ) {}
}

export function ForEach<T>(expr: State<T[], any>, body: ForEachBody<T>) {
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
    public itemState?: State<T>
  ) {}
}

function reconcile<T>(next: T[], prev?: T[]) {
  if (!prev) {
    return next;
  }
  return next;
}
