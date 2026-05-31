import { RootScope, Scope, State, useState } from '../state';

type BodyFun = (e: State<unknown>) => any;

export type ForEachBody = string | BodyFun | State<any> | number | boolean;

export class ForEachComponent<T> {
  constructor(
    public expr: State<T[]>,
    public initial: T[] | void,
    public body: ForEachBody
  ) {}
}

export function ForEach<T>(expr: State<T[]>, body: ForEachBody) {
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
