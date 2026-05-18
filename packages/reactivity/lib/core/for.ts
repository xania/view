import { State, useState } from '../state';

type BodyFun = (e: State<unknown>) => any;

type ForEachBody = string | BodyFun | State<any> | number | boolean;

export function ForEach<T>(expr: State<T[]>, body: ForEachBody) {
  if (body instanceof Function) {
    const itemState = useState<T>(undefined);
    return new Iterator(expr, body(itemState), itemState);
  }

  return new Iterator(expr, body);
}

export class Iterator<T> {
  constructor(
    public expr: State<T[]>,
    public body: any,
    public itemState?: State<T>
  ) {}
}
