import { Signal2 } from './signal';

export const keyProp = Symbol('state');

export function signal<T>(value?: T) {
  return new Signal2(value);
}

export * from './signal';
export * from './scope';
