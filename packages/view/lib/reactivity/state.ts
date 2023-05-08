import { Reactive, Unwrap, Value } from './reactive';

export class State<T = any> extends Reactive<T> {
  constructor(public key: symbol = Symbol(), public initial?: Value<T>) {
    super();
  }
}

export function useState<T>(): State<Unwrap<T>>;
export function useState<T>(value: T): State<Unwrap<T>>;
export function useState<T>(value?: T) {
  return new State(Symbol(), value);
}
