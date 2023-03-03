import { DefaultSyncScheduler } from '../scheduler';
import { Value } from './value';

export class State<T> extends Value<T> {
  constructor(snapshot?: T) {
    super(snapshot);
  }

  set = (input: T | Updater<T>, scheduler = DefaultSyncScheduler) => {
    const { snapshot } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }
    scheduler?.schedule(this);
  };

  // state can be used as observer
  next = this.set;
}

type Updater<T> = (t?: T) => undefined | T;
