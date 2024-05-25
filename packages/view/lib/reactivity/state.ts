import { Signal, Unwrap } from './signal';

export class State<T = any> extends Signal<T> {
  dependencies?: undefined = undefined;
}

export function useState<T>(): State<Unwrap<T>>;
export function useState<T>(value: T): State<Unwrap<T>>;
export function useState<T>(value?: T) {
  return new State(value);
}

export function state<T>(): State<Unwrap<T>>;
export function state<T>(value: T): State<Unwrap<T>>;
export function state<T>(value?: T) {
  return new State(value);
}
