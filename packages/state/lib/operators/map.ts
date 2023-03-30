import { Rx } from '../rx';

export class MapOperator<T, U> implements Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;
  constructor(
    public func: (t: T) => U | undefined,
    public target: Rx.Stateful<U>
  ) {}
}

export function pushOperator(g: Rx.Stateful, op: Rx.StateOperator<any>) {
  // this.dependent = mop;
  const { operators } = g;
  if (operators) {
    operators.push(op);
  } else {
    g.operators = [op];
  }

  const { deps } = op.target;
  if (deps) {
    if (deps instanceof Array) {
      deps.push(g);
    } else {
      op.target.deps = [deps, g];
    }
  } else {
    op.target.deps = g;
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

  const { deps } = op.target;
  if (deps instanceof Array) {
    const idx = deps.indexOf(s);
    if (idx >= 0) {
      deps.splice(idx, 1);
    }
  } else if (deps === s) {
    op.target.deps = undefined;
  }
}
