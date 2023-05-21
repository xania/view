import { Reactive, Unwrap } from './reactive';

export class State<T = any> extends Reactive<T> {}

export function useState<T>(): State<Unwrap<T>>;
export function useState<T>(value: T): State<Unwrap<T>>;
export function useState<T>(value?: T) {
  return new State(value);
}
