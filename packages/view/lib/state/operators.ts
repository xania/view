import { Signal } from './signal';

export interface MapOperator<T, U> {
  mapper: (x: T) => U;
  target: Signal<U>;
}
