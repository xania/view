import { Signal, Unwrap } from './signal';

export class State<T = any> extends Signal<T> {
  dependencies?: undefined = undefined;
}

export function useState<T>(): State<Unwrap<T>>;
export function useState<T>(initial: T): State<Unwrap<T>>;
export function useState<T>(initial?: T) {
  return new State(initial);
}

export function state<T>(): State<Unwrap<T>>;
export function state<T>(intial: T): State<Unwrap<T>>;
export function state<T>(initial?: T) {
  return new State(initial);
}

export function signal<T>(): State<Unwrap<T>>;
export function signal<T>(intial: T): State<Unwrap<T>>;
export function signal<T>(initial?: T) {
  return new State(initial);
}
