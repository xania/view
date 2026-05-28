import { State, Value } from '../state';

export function If(expr: State<boolean>, body: any) {
  return new Conditional(expr, body);
}

export class Conditional {
  constructor(
    public expr: State<boolean> | Value<boolean>,
    public body: any
  ) {}
}
