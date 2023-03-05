import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { scheduleState } from '../scheduler';
import { dependsOn } from './computed';
import { nodeToString } from './utils';

export class Signal<T = any> implements Rx.Stateful<T> {
  constructor(public snapshot: T, public label?: string) {}

  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: Rx.StateOperator<T>[] | undefined;

  subscribe: Rx.Subscribable<T>['subscribe'] = subscribe;

  get = this.read;
  read() {
    dependsOn(this);
    return this.snapshot;
  }

  set = (newValue: T) => {
    const { snapshot } = this;
    if (newValue === snapshot) {
      return false;
    }
    this.snapshot = newValue;

    this.dirty = true;
    scheduleState(this);

    return true;
  };
  write = this.set;

  toString = nodeToString;
}

export function signal<T>(value: T, label?: string) {
  return new Signal(value, label);
}
