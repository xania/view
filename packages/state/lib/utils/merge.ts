import { State } from '..';
import { pushOperator } from '../operators/map';
import { Rx } from '../rx';

export function merge<T>(...sources: Rx.Stateful<T>[]) {
  const target = new State<T>();

  const connectOp: Rx.ConnectOperator<T> = {
    type: Rx.StateOperatorType.Connect,
    target,
  };

  for (const source of sources) {
    pushOperator(source, connectOp);

    const { snapshot } = source;
    if (snapshot !== undefined) {
      target.snapshot = snapshot;
      target.dirty = true;
    }
  }

  return target;
}
