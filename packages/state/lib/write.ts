import { Rx } from './rx';
import { sync } from './sync';

type Updater<T> = (t?: T) => undefined | T;

export type WriteFunction<T> = (
  this: Rx.Stateful<T>,
  input: T | Updater<T>
) => void;
export function write<T>(this: Rx.Stateful<T>, input: T | Updater<T>) {
  const { snapshot } = this;
  const newValue = input instanceof Function ? input(snapshot) : input;

  if (newValue !== snapshot) {
    this.snapshot = newValue;
    this.dirty = true;
    if (_scheduler) {
      _scheduler.add(this);
    } else {
      sync(this);
    }
    return true;
  } else {
    return false;
  }
}

interface Scheduler {
  add(s: Rx.Stateful): void;
}
let _scheduler: Scheduler | null = null;
export function pushScheduler(scheduler: Scheduler) {
  if (_scheduler) {
    throw Error('cascading scheduler not (yet) supported');
  }
  _scheduler = scheduler;
}
export function popScheduler(scheduler: Scheduler) {
  if (scheduler !== _scheduler) {
    throw Error('scheduler mismatch');
  }

  _scheduler = null;
}
