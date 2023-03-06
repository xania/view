import { fromPromise } from '../observable/from-promise';
import {
  fromAsyncIterable,
  isAsyncIterable,
} from '../observable/async-interable';
import { fromObservable, isObservable } from '../observable/from-observable';
import { State } from '../observable/state';
import { Rx } from '../rx';
import { Value } from '../observable/value';
import { Signal } from '../signal';

export function from<T>(input: Promise<T>): State<T>;
export function from<T>(input: AsyncIterable<T>): State<T>;
export function from<T>(input: Rx.Observable<T>): State<T>;
export function from<T, S extends Rx.StateInput<T>>(input: S): S;
export function from(input: Rx.StateInput<any>) {
  if (input instanceof Value || input instanceof Signal) {
    return input;
  }

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
