import { State } from './state';

export function state<T>(value?: T) {
  return new State(value);
}

export * from './update';
export * from './state';
export * from './scope';
export * from './if';
export * from './list';
