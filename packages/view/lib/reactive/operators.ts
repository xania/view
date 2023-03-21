import { State } from './state';

export interface MapOperator<T, U> {
  mapper: (x: T) => U;
  target: State<U>;
}
