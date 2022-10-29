interface Observable<T> {
  next(value: T): void;
}

export function useState<T>(value: T) {
  return new State(value);
}

export class State<T> {
  observers: Observable<T>[] = [];
  constructor(public current?: T) {}

  subscribe(observer: Observable<T>) {
    const { observers, current } = this;
    const len = observers.length;
    observers[len] = observer;

    if (current !== undefined) {
      observer.next(current);
    }

    return {
      unsubscribe() {
        const idx = observers.indexOf(observer);
        if (idx >= 0) observers.splice(idx, 1);
      },
    };
  }

  update(func: (p?: T) => T) {
    const { current: value } = this;

    const newValue = func(value);
    if (newValue !== value) {
      this.current = newValue;
      for (const o of this.observers) {
        o.next(newValue);
      }
    }
  }

  set(newValue: T) {
    const { current: value } = this;
    if (newValue !== value) {
      this.current = newValue;
      for (const o of this.observers) {
        o.next(newValue);
      }
    }
  }

  map<U>(func: (x?: T) => U) {
    const { observers } = this;
    const mappedState = new MappedState<T | undefined, U>(this.current, func);
    observers.push(mappedState);

    return mappedState;
  }

  toString() {
    return this.current;
  }
}

class MappedState<T, U> extends State<U> {
  /**
   *
   */
  constructor(current: T, private mapper: (value: T) => U) {
    super(mapper(current));
  }

  next(newValue: T) {
    this.set(this.mapper(newValue));
  }
}
