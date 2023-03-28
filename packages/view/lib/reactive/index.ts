import { State } from './state';

export function state<T>(value?: JSX.MaybePromise<T>) {
  return new State(value);
}

export * from './state';
export * from './if';
export * from './list';
export * from './commands';
