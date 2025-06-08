import { State } from '../state';

export function If(expr: State<boolean>, body: any) {
  return new Conditional(expr, body);
}

export class Conditional {
  constructor(
    public expr: State<boolean>,
    public body: any
  ) {}
}
