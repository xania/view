import { Rx } from '../rx';

export class MapOperator<T, U> implements Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;

  dirty: boolean = false;
  observers?: Rx.NextObserver<U>[] | undefined;
  operators?: Rx.StateOperator<U>[];

  constructor(public func: (t: T) => U, public target: Rx.Stateful<U>) {}
}

export function pushOperator(g: Rx.Stateful, op: Rx.StateOperator<any>) {
  // this.dependent = mop;
  const { operators } = g;
  if (operators) {
    if (operators.includes(op)) debugger;
    else operators.push(op);
  } else {
    g.operators = [op];
  }
}
export function removeOperator(s: Rx.Stateful, op: Rx.StateOperator) {
  const { operators } = s;
  if (operators) {
    for (let i = 0, len = operators.length; i < len; i++) {
      if (operators[i] === op) {
        for (let n = i + 1; n < len; n++) {
          operators[n - 1] = operators[n];
        }
        operators.length--;
        break;
      }
    }
  }
}
