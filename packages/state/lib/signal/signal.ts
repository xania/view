import { Value } from '../observable/value';
import { write } from '../write';
import { dependsOn } from './computed';
import { nodeToString } from './utils';

export class Signal<T = any> extends Value<T> {
  constructor(public snapshot: T, public label?: string) {
    super(snapshot);
  }

  get = this.read;
  read() {
    dependsOn(this);
    return this.snapshot;
  }

  write = write;
  set = this.write;

  toString = nodeToString;
}

export function signal<T>(value: T, label?: string) {
  return new Signal(value, label);
}
