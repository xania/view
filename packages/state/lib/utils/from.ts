import { fromPromise } from '../observable/from-promise';
import {
  fromAsyncIterable,
  isAsyncIterable,
} from '../observable/async-interable';
import { Value } from '../observable/value';
import { fromObservable, isObservable } from '../observable/from-observable';
import { StateInput } from '../state-input';
import { Signal } from '../signal/signal';
import { State } from '../observable/state';
import { Rx } from '../rx';

export function from<T>(input: Value<T>): Value<T>;
export function from<T>(input: State<T>): State<T>;
export function from<T>(input: Signal<T>): Signal<T>;
export function from<T>(input: Promise<T>): State<T>;
export function from<T>(input: AsyncIterable<T>): State<T>;
export function from<T>(input: Rx.Observable<T>): State<T>;
export function from(input: StateInput<any>) {
  if (input instanceof Value) {
    return input;
  }

  if (input instanceof Signal) return input;

  if (input instanceof Promise) {
    return fromPromise(input);
  }

  if (isAsyncIterable(input)) {
    return fromAsyncIterable(input);
  }

  if (isObservable(input)) {
    return fromObservable(input);
  }

  return input;
}
