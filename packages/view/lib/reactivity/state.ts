import { Reactive, Unwrap } from './reactive';

export class State<T = any> extends Reactive<T> {
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
