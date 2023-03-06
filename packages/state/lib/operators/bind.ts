import { connect } from '../graph';
import type { Value } from '../observable/value';
import { Rx } from '../rx';
import { pushOperator } from './map';

export function bind<T, U>(
  source: Rx.Stateful<T>,
  binder: (t: T) => Rx.StateInput<U>,
  target: Value<U>
) {
  // const { snapshot } = source;

  target.dirty = Rx.STALE;

  connect(source, target);

  const connectOp = {
    type: Rx.StateOperatorType.Connect,
    target,
  } as Rx.ConnectOperator<U>;

  const bindOp = {
    type: Rx.StateOperatorType.Bind,
    target,
    binder,
    connectOp,
  } satisfies Rx.BindOperator<T, U>;

  pushOperator(source, bindOp as Rx.StateOperator<T>);
  return target;
}

// function removeOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
//   const { operators } = state;
//   if (operators) {
//     const idx = operators.indexOf(op);
//     operators.splice(idx, 1);
//   }
// }

// function addOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
//   const { operators } = state;
//   if (operators) {
//     operators.push(op);
//   } else {
//     state.operators = [op];
//   }
// }
