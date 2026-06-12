import type { ItemState, Lense, Scope, State } from '../state';
import { createReconcile } from './reconcile';

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

  if (initial instanceof Promise) {
    throw new Error('not yet implemeted');
  }
  return new ForEachComponent(expr, initial, body);
}

export class Iterator<T> {
  constructor(
    public body: any,
    public scope: Scope,
    public itemState?: ItemState<T>
  ) {}
}
