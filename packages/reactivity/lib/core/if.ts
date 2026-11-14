import { State, Value } from '../state';

export function If(expr: State<boolean> | Value<boolean>, body: unknown): any {
  if (expr instanceof State) {
    const initial = expr.initial;
    if (initial instanceof Promise) {
      return initial.then((resolved) => new Conditional(expr, body, resolved));
    }
    return new Conditional(expr, body, initial);
  } else if (expr instanceof Promise) {
    return expr.then((resolved) => If(resolved, body));
  } else if (expr) {
    return body;
  } else {
    return void 0;
  }
}

export class Conditional {
  constructor(
    public expr: State<boolean>,
    public body: unknown,
    public visible: boolean | void
  ) {}
}
