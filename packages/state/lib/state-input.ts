import type { Rx } from './rx';
import type { Value } from './observable/value';
import type { Signal } from './signal/signal';
import type { State } from './observable/state';

export type StateInput<T> =
  | Promise<T>
  | AsyncIterable<T>
  | Value<T>
  | State<T>
  | Signal<T>
  | Rx.Observable<T>;
