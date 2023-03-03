import { pushNode, removeNode } from '../graph';
import { Rx } from '../rx';
import { StateInput } from '../state-input';
import { from } from '../utils/from';
import { id } from '../utils/id';

export function bind<T, U, TTarget extends Rx.Stateful>(
  source: Rx.Stateful<T>,
  binder: (t: T) => StateInput<U>,
  target: TTarget
): TTarget {
  const { snapshot } = source;

  pushNode(source, target, false);

  const connectOp = {
    type: Rx.StateOperatorType.Bind,
    func: id,
    target,
  } as Rx.BindOperator<U>;

  const bindOp = {
    prevState: undefined as Rx.Stateful<U> | undefined | null,
    type: Rx.StateOperatorType.Bind,
    func(x: T): U {
      const boundState = from(binder(x) as any) as Rx.Stateful<any>;
      const { prevState } = this;
      if (prevState !== boundState) {
        if (prevState) {
          removeNode(prevState, this.target);
          removeOperation(prevState, connectOp);
        }
        if (boundState) {
          pushNode(boundState, this.target, false);
          addOperation(boundState, connectOp);
        }
        this.prevState = boundState;
        return boundState?.snapshot as U;
      } else {
        return prevState?.snapshot as U;
      }
    },
    target,
  };

  if (snapshot) {
    const init = bindOp.func(snapshot);
    if (init !== undefined) {
      target.snapshot = init;
    }
  }

  addOperation(source, bindOp as Rx.StateOperator<T>);
  return target;
}

function removeOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
  const { operators } = state;
  if (operators) {
    const idx = operators.indexOf(op);
    operators.splice(idx, 1);
  }
}

function addOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
  const { operators } = state;
  if (operators) {
    operators.push(op);
  } else {
    state.operators = [op];
  }
}
