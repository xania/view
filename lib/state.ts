const previous: unique symbol = Symbol();

abstract class Value<T> implements JSX.Value<T> {
  observers: JSX.NextObserver<T>[] = [];
  properties: Value<any>[] = [];

  constructor(public value: T | null = null) {}

  [previous]: T | undefined;

  abstract flush(): boolean;

  toString = () => this.value;
  valueOf = () => this.value;

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: JSX.Unsubscribable | null = null;
    function sub(resolver: (v: IteratorResult<T>) => void) {
      if (subscription == null) {
        if (state.value !== null && state.value !== undefined)
          resolver({ value: state.value });
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

  subscribe<O extends JSX.NextObserver<T>>(observer: O) {
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

  get<K extends keyof T>(k: K) {
    const { value, properties } = this;
    const keyValue: any =
      value === undefined || value === null ? null : value[k];

    const property: StateProperty<T, K> =
      (properties as any)[k] ??
      new StateProperty<T, K>(this, k, this.flush, keyValue);
    this.properties.push(property);
    return property;
  }

  map = <U>(project: (value: T) => U | null): JSX.Value<U> => {
    const mapper = new StateMap<T, U>(project, this.flush);
    this.properties.push(mapper);
    return mapper;
  };
}

export class State<T> extends Value<T> {
  constructor(value: T | null, public flush = () => _flush([this])) {
    super(value);
  }

  update = (valueOrUpdater: T | Updater<T>) => {
    const value =
      valueOrUpdater instanceof Function
        ? valueOrUpdater(this.value)
        : valueOrUpdater;

    if (value !== undefined) this.value = value;
    this.flush();
  };
}

export function useState<T>(value: T | null) {
  return new State<T>(value);
}

class StateProperty<T, K extends keyof T> extends Value<T[K]> {
  constructor(
    public parent: Value<T>,
    public name: K,
    public flush: () => boolean,
    value: T[K] | null = null
  ) {
    super(value);
  }

  update = (valueOrUpdater: T[K] | Updater<T[K]>) => {
    let newValue =
      valueOrUpdater instanceof Function
        ? valueOrUpdater(this.value)
        : valueOrUpdater;

    let parent = this.parent;
    while (parent) {
      const parentValue = parent.value;
      if (parentValue) {
        parentValue[this.name] = newValue as any;
        break;
      } else {
        parent.value = newValue = { [this.name]: newValue } as any;
      }
      if (parent instanceof StateProperty) parent = parent.parent;
      else break;
    }

    this.flush();
  };
}

class StateMap<T, U> extends Value<U> {
  constructor(public project: (t: T) => U | null, public flush: () => boolean) {
    super(null);
  }
}
type Updater<T> = (value: T | null) => T | void;

type LinkedList<T> = null | { head: T; tail: LinkedList<T> };

export function _flush(root: Item[]) {
  const dirty = digest(root);
  for (const o of dirty as any) {
    o.next(o[previous]);
  }
  return dirty.length > 0;
}

type Item = {
  value: any | null;
  [previous]?: any;
  observers: JSX.NextObserver<any>[];
  properties: Value<any>[];
};

function digest(root: Item[]) {
  type Dependency = { list: LinkedList<Item> };
  type StackItem = [Item, Dependency];
  const stack: StackItem[] = [];
  const dirty: { value?: any; observers: JSX.NextObserver<any>[] }[] = [];

  const rootDep: Dependency = { list: null };
  for (const r of root) stack.push([r, rootDep]);

  while (stack.length) {
    let [state, parentdependency] = stack.pop() as StackItem;

    const newValue = state.value;
    const oldValue = state[previous];
    let currdep: Dependency = { list: null };
    if (newValue !== oldValue) {
      state[previous] = newValue;
      if (state.observers && state.observers.length) {
        for (const o of state.observers as any) {
          o[previous] = newValue;
          dirty.push(o);
        }
      }
      let list = parentdependency.list;
      while (list) {
        for (const o of list.head.observers as any) {
          o[previous] = newValue;
          dirty.push(o);
        }
        list = list.tail;
      }
      parentdependency.list = null;
    } else {
      currdep.list = { head: state, tail: parentdependency.list };

      if (state.observers && state.observers.length) {
        for (const o of state.observers as any) {
          if (o[previous] !== newValue) {
            o[previous] = newValue;
            dirty.push(o);
          }
        }
      }
    }

    if (newValue === null || newValue === undefined) {
      for (const p of state.properties) {
        p.value = null;
        stack.push([p, currdep]);
      }
    } else
      for (const p of state.properties) {
        if (p instanceof StateProperty) {
          p.value = newValue[p.name];
        } else if (p instanceof StateMap) {
          p.value = p.project(newValue);
        }
        stack.push([p, currdep]);
      }
  }

  return dirty;
}
