interface Observable<T> {
  next(value: T): void;
}

export class State<T> {
  observers: Observable<T>[] = [];
  constructor(public current: T) {}

  subscribe(observer: Observable<T>) {
    const { observers } = this;
    const len = observers.length;
    observers[len] = observer;

    return {
      unsubscribe() {
        const idx = observers.indexOf(observer);
        if (idx >= 0) observers.splice(idx, 1);
      },
    };
  }

  update(func: (p: T) => T) {
    const { current: value } = this;
    const newValue = func(value);
    if (newValue !== value) {
      this.current = newValue;
      for (const o of this.observers) {
        o.next(newValue);
      }
    }
  }

  toString() {
    return this.current;
  }
}
