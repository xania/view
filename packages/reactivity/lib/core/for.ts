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
  if (initial instanceof Promise) {
    return initial.then(
      (resolved) => new ForEachComponent(expr, resolved, body)
    );
  }
  return new ForEachComponent(expr, initial, body);
}

export class Iterator<T> {
  constructor(
    public body: any,
    public scope: Scope,
    public itemState?: State<T>
  ) {}
}
