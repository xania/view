import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { schedule } from '../scheduler';
import { register } from './computed';
import { nodeToString } from './utils';

export class Signal<T = any> implements Rx.Stateful<T> {
  constructor(public snapshot: T, public label?: string) {}

  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: Rx.StateOperator<T>[] | undefined;

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot as T;
  };

  set = (newValue: T) => {
    const { snapshot } = this;
    if (newValue === snapshot) {
      return false;
    }
    this.snapshot = newValue;
    if (this.dirty) {
      return false;
    }
    this.dirty = true;
    schedule(this);
    return true;
  };

  toString = nodeToString;
}

export function signal<T>(value: T, label?: string) {
  return new Signal(value, label);
}
