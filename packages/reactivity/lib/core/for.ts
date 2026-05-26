import { RootScope, Scope, State, useState } from '../state';

type BodyFun = (e: State<unknown>) => any;

type ForEachBody = string | BodyFun | State<any> | number | boolean;

export function ForEach<T>(
  expr: State<T[]>,
  body: ForEachBody,
  scope: Scope = RootScope
) {
  const childScope = scope.pushScope();
  if (body instanceof Function) {
    const itemState = childScope.state<T>();
    return new Iterator(expr, body(itemState), childScope, itemState);
  }

  return new Iterator(expr, body, childScope);
}

export class Iterator<T> {
  constructor(
    public expr: State<T[]>,
    public body: any,
    public scope: Scope,
    public itemState?: State<T>
  ) {}
}
