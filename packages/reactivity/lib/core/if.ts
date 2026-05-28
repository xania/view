import { State, Value } from '../state';

export function If(expr: State<boolean>, body: any) {
  const initial = expr.initial;
  if (initial instanceof Promise) {
    return initial.then((resolved) => new Conditional(expr, body, resolved));
  }
  return new Conditional(expr, body, initial);
}

export class Conditional {
  constructor(
    public expr: State<boolean> | Value<boolean>,
    public body: any,
    public visible: boolean | void
  ) {}
}
