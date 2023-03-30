import { subscribe as _subscribe } from './subscribe';
import type { Rx } from '../rx';
import { MapOperator, pushOperator } from '../operators/map';
import { prop } from '../operators/prop';
import { bind } from '../operators/bind';
import { combineLatest } from '../utils/combine-latest';
import { read } from '../signal/computed';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators?: Rx.StateOperator<T>[];
  deps?: Rx.Stateful<any> | Rx.Stateful<any>[];

  public dirty: Rx.Stateful['dirty'] = false;

  constructor(
    public snapshot?: T | undefined,
    public subscribe: Rx.Subscribable<T>['subscribe'] = _subscribe as any
  ) {}

  dispose() {
    const { deps } = this;
    if (deps) {
      if (deps instanceof Array) {
        for (const dep of deps) {
          this.disconnect(dep);
        }
      } else {
        this.disconnect(deps);
      }
    }
  }

  disconnect(dep: Rx.Stateful) {
    const operators = dep.operators;
    if (operators) {
      for (let i = operators.length - 1; i >= 0; i--) {
        const op = operators[i];
        if (op.target === this) {
          operators.splice(i, 1);
        }
      }
    }
  }

  get = read;
  read = read;

  map<U>(f: (x: T) => U | undefined) {
    const { snapshot } = this;
    const mapTarget = new Value<U>(
      snapshot !== undefined ? f(snapshot) : undefined
    );
    const mop: any = new MapOperator(f, mapTarget);
    pushOperator(this, mop);
    return mapTarget;
  }

  prop = prop;

  bind<U>(binder: (t: T) => Rx.StateInput<U>) {
    return bind(this, binder, new Value());
  }
  pipe = this.bind;

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: Rx.Subscription | null = null;

    const pending: T[] = [];
    let _resolver: null | ((next: { value: T }) => void) = null;

    subscription = state.subscribe({
      next(value: T) {
        if (_resolver !== null && _resolver !== undefined) {
          _resolver({ value });
          // resolver of a Promise can only be used once
          _resolver = null;
        } else pending.push(value);
      },
    });

    function sub(resolve: (v: IteratorResult<T>) => void) {
      if (pending.length > 0) {
        resolve({ value: pending.shift() as T });
      } else {
        _resolver = resolve;
      }
    }
    return {
      next() {
        return new Promise(sub);
      },
      return() {
        if (subscription) subscription.unsubscribe();
        return Promise.resolve({ value: state.snapshot, done: true });
      },
      throw(err: any) {
        return Promise.reject(err);
      },
    };
  };

  join<U>(x: Rx.StateInput<U>): Value<[T, U]>;
  join<U, R>(x: Rx.StateInput<U>, map: (x: T, y: U) => R): Value<R>;
  join<U, R>(x: Rx.StateInput<U>, map?: (x: T, y: U) => R) {
    const comb = combineLatest([this, x]);
    if (map) return comb.map((p) => map.apply(null, p));
    else return comb;
  }

  effect(fn: (value: T) => void) {
    return this.subscribe({ next: fn });
  }
}
