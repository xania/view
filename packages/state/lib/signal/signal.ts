import { Value } from '../observable/value';
import { write } from '../write';
import { read } from './computed';
import { nodeToString } from './utils';

export class Signal<T = any> extends Value<T> {
  constructor(public snapshot: T, public label?: string) {
    super(snapshot);
  }

  get = read;
  read = read;
  write = write;
  set = write;

  toString = nodeToString;
}

export function signal<T>(value: T, label?: string) {
  return new Signal(value, label);
}
