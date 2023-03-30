import {
  fromAsyncIterable,
  isAsyncIterable,
} from '../observable/async-interable';
import { fromObservable, isObservable } from '../observable/from-observable';
import { State } from '../observable/state';
import type { Rx } from '../rx';
import { Value } from '../observable/value';

export function from<T>(input: Rx.StateInput<T>): Rx.Stateful<T>;
export function from<T>(input: AsyncIterable<T>): State<T>;
export function from<T>(input: Rx.Observable<T>): State<T>;
export function from<T>(input: Rx.StateInput<T>): Rx.Stateful<T> {
  if (input instanceof Value) {
    return input;
  }

  if (isAsyncIterable(input)) {
    return fromAsyncIterable<T>(input);
  }

  if (isObservable(input)) {
    return fromObservable<T>(input);
  }

  return input;
}
