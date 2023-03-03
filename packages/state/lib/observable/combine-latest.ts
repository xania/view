import { pushNode } from '../graph';
import { MapOperator, pushOperator } from '../operators/map';
import { Rx } from '../rx';
import { subscribe } from './subscribe';
import { from } from '../utils/from';
import { Value } from './value';
import { StateInput } from '../state-input';
const syncValue = Symbol('snapshot');

export type UnwrapState<T> = T extends Rx.Stateful<infer U> ? U : never;
export type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

export function combineLatest<TArgs extends [...StateInput<any>[]]>(
  args: [...TArgs]
) {
  const argsLen = args.length;
  const snapshot: any[] = new Array(argsLen);
  const target = new CombinedState<UnwrapStates<TArgs>>(snapshot as any);

  for (let i = 0; i < argsLen; i++) {
    const source = from(args[i] as any) as Rx.Stateful<any>;
    pushNode(source, target, false);

    snapshot[i] = source.snapshot;

    const mergeOp: Rx.MergeOperator<any, any> = {
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
    };
    pushOperator(source, mergeOp);
  }

  return target;
}

class CombinedState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers?: Rx.NextObserver<T>[];
  operators?: Rx.StateOperator<T>[];
  dirty = false;

  constructor(public readonly snapshot: T) {}

  get() {
    return this.snapshot;
  }

  subscribe = subscribe;

  map<U>(f: (x: T) => U) {
    const { snapshot } = this;
    let mappedValue = undefined;
    for (let i = 0, len = snapshot.length; i < len; i++) {
      if (snapshot[i] === undefined) break;
      if (i + 1 === len) {
        mappedValue = f(snapshot);
      }
    }

    const target = new Value<U>(mappedValue);
    const operator: any = new MapOperator(f, target);
    pushNode(this, operator, false);
    pushOperator(this, operator);

    return target;
  }

  notify() {
    const { observers, snapshot } = this;
    if (observers && snapshot.every((x) => x !== undefined)) {
      for (const obs of observers as any) {
        if (obs[syncValue] !== snapshot) {
          obs[syncValue] = snapshot;
          obs.next(snapshot);
        }
      }
    }
  }
}
