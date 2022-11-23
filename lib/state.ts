interface Parent {
  properties: StateProjection[];
}

interface StateProjection {
  value?: any;
  observers: any;
  properties: any;
  project<T>(value?: T): any;
}

export class State<T> implements JSX.State<T> {
  observers: JSX.NextObserver<T>[] = [];
  properties: StateProjection[] = [];

  constructor(
    public value?: T,
    public parent: Parent | null = null,
    public project: (() => T) | null = null
  ) {}

  toString() {
    return this.value;
  }

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: JSX.Unsubscribable | null = null;
    function sub(resolver: (v: IteratorResult<T>) => void) {
      if (subscription == null) {
        if (state.value !== undefined) resolver({ value: state.value });
      }
      subscription = state.subscribe({
        next(value: T) {
          resolver({ value });
        },
      });
    }
    return {
      next() {
        return new Promise(sub).then((v) => (subscription?.unsubscribe(), v));
      },
      return() {
        if (subscription) subscription.unsubscribe();
        return Promise.resolve({ value: state.value, done: true });
      },
      throw(err) {
        return Promise.resolve(err);
      },
    };
  };

  get<K extends keyof T>(k: K) {
    const { value } = this;
    const keyValue: any =
      value === undefined || value === null ? null : value[k];
    const property: any = new State<T[K]>(
      keyValue,
      this,
      () => (this.value as any)[k]
    );
    this.properties.push(property);
    return property;
  }

  flush() {
    type StackItem<T> = [T | null, StateProjection];
    const stack: StackItem<any>[] = [];
    const dirty: { value?: any; observers: JSX.NextObserver<T>[] }[] = [];

    dirty.push(this);

    for (const p of this.properties) {
      stack.push([p.project(), p]);
    }

    while (stack.length) {
      const [newValue, state] = stack.pop() as any;

      if (newValue !== state.value) {
        state.value = newValue;
        dirty.push(state);
      }

      if (newValue === null || newValue === undefined) {
        for (const p of state.properties) {
          stack.push([null, p]);
        }
      } else
        for (const p of state.properties) {
          stack.push([p.project(newValue), p]);
        }
    }
    for (const d of dirty) {
      for (const o of d.observers) {
        o.next(d.value);
      }
    }
  }

  subscribe(observer: JSX.NextObserver<T>) {
    const { observers } = this;
    observers.push(observer as any);

    return {
      unsubscribe() {
        const idx = observers.indexOf(observer as any);
        if (idx >= 0) {
          observers.splice(idx, 1);
        }
      },
    };
  }

  update = (valueOrUpdater: T | Updater<T>) => {
    const value =
      valueOrUpdater instanceof Function
        ? valueOrUpdater(this.value)
        : valueOrUpdater;

    if (value !== this.value) {
      this.value = value;
      this.flush();
    }
  };

  map = <U>(project: (value: T) => U) => {
    var mapper = new State(undefined, this, () => project(this.value as any));
    this.properties.push(mapper as any);
    return mapper;
  };

  dispose() {
    const { parent } = this;
    const { properties } = parent as any;
    const idx = properties.indexOf(this);
    if (idx >= 0) {
      properties.splice(idx, 1);
    }
  }
}

export function useState<T>(value?: T) {
  return new State<T>(value);
}

type Updater<T> = (value?: T) => T;
