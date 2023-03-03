import { subscribe as _subscribe } from './subscribe';
import { Rx } from '../rx';
import { MapOperator, pushOperator } from '../operators/map';
import { prop } from '../operators/prop';
import { bind } from '../operators/bind';
import { pushNode } from '../graph';
import type { StateInput } from '../state-input';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  public dependent?: Rx.Stateful<any>;
  dirty = false;

  constructor(public snapshot?: T, public subscribe = _subscribe) {}

  get = () => {
    return this.snapshot;
  };

  map<U>(f: (x: T) => U) {
    const { snapshot } = this;
    const mapTarget = new Value<U>(
      snapshot !== undefined ? f(snapshot) : undefined
    );
    const mop: any = new MapOperator(f, mapTarget);
    pushNode(this, mapTarget);
    pushOperator(this, mop);
    return mapTarget;
  }

  prop = prop;
  bind<U>(binder: (t: T) => StateInput<U>) {
    bind(this, binder, new Value<U>());
  }

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
}
