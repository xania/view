import type { Rx } from '../rx';
import { State } from '../observable/state';

export function isObservable<T>(value: any): value is Rx.Observable<T> {
  return value && value.subscribe instanceof Function;
}

export function fromObservable<T>(value: Rx.Observable<T>) {
  const s = new State<T>();
  const sub = value.subscribe({
    next: s.set,
    complete() {
      sub.unsubscribe();
    },
  });

  return s;
}
