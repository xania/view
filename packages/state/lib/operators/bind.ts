import type { Value } from '../observable/value';
import { Rx } from '../rx';
import { from } from '../utils/from';
import { pushOperator } from './map';

export function bind<T, U>(
  source: Rx.Stateful<T>,
  binder: (t: T) => Rx.StateInput<U>,
  target: Value<U>
) {
  target.dirty = Rx.STALE;

  const connectOp = {
    type: Rx.StateOperatorType.Connect,
    target,
  } as Rx.ConnectOperator<U>;

  const { snapshot } = source;
  const boundState =
    snapshot !== undefined ? from(binder(snapshot)) : undefined;

  if (boundState) {
    pushOperator(boundState, connectOp);

    if (
      boundState.snapshot !== undefined &&
      boundState.snapshot !== target.snapshot
    ) {
      target.snapshot = boundState.snapshot;
      target.dirty = true;
    }
  }

  const bindOp = {
    boundState,
    type: Rx.StateOperatorType.Bind,
    target,
    binder,
    connectOp,
  } satisfies Rx.BindOperator<T, U>;

  pushOperator(source, bindOp as Rx.StateOperator<T>);
  return target;
}
