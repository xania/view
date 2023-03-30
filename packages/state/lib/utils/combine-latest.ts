import { MapOperator, pushOperator } from '../operators/map';
import { Rx } from '../rx';
import { subscribe } from '../observable/subscribe';
import { from } from './from';
import { Value } from '../observable/value';
const syncValue = Symbol('snapshot');

export type UnwrapState<T> = T extends Rx.Stateful<infer U> ? U : never;
export type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

export function combineLatest<TArgs extends [...Rx.StateInput<any>[]]>(
  args: [...TArgs]
) {
  const argsLen = args.length;

  const snapshot: any = new Array(argsLen);
  const sources: any = new Array(argsLen);
  const target = new CombinedState<UnwrapStates<TArgs>>(snapshot, sources);

  const joinOp: Rx.JoinOperator = {
    type: Rx.StateOperatorType.Join,
    target,
  };

  for (let i = 0; i < argsLen; i++) {
    const source = from(args[i] as any) as Rx.Stateful<any>;

    sources[i] = source;
    snapshot[i] = source.snapshot;

    pushOperator(source, joinOp);
  }

  return target;
}

class CombinedState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers?: Rx.NextObserver<T>[];
  operators?: Rx.StateOperator<T>[];
  dirty = false;
  depth = 0;

  constructor(
    public readonly snapshot: T,
    public sources: { [P in keyof T]: Rx.Stateful<T> }
  ) {
    for (let i = 0, len = sources.length; i < len; i++) {
      const s = sources[i];

      if (s.depth !== undefined) {
        if (s.depth >= this.depth) {
          this.depth = s.depth + 1;
        }
      }
    }
  }

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
