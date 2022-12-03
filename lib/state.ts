export const _previous: unique symbol = Symbol();

abstract class Value<T> implements JSX.Value<T> {
  observers?: JSX.NextObserver<T>[];
  properties?: Value<any>[];

  constructor(public snapshot: T) {}

  [_previous]: T | undefined;

  abstract flush(dirty: DirtyItem): boolean;

  toString = () => (this.snapshot ? (this.snapshot as any).toString() : '');

  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const state = this;
    let subscription: JSX.Unsubscribable | null = null;
    function sub(resolver: (v: IteratorResult<T>) => void) {
      if (subscription == null) {
        if (state.snapshot !== null && state.snapshot !== undefined)
          resolver({ value: state.snapshot });
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
        return Promise.resolve({ value: state.snapshot, done: true });
      },
      throw(err: any) {
        return Promise.resolve(err);
      },
    };
  };

  subscribe<O extends JSX.NextObserver<T>>(observer: O) {
    const { snapshot: value } = this;

    const observers = this.observers ?? (this.observers = []);
    observers.push(observer as any);

    if (value !== undefined) {
      (observer as any)[_previous] = value;
      observer.next(value);
    }

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
    const { snapshot: value } = this;
    const keyValue: any =
      value === undefined || value === null ? null : value[k];

    const properties = this.properties ?? (this.properties = []);

    const property: StateProperty<T, K> =
      (properties as any)[k] ??
      new StateProperty<T, K>(this, k, this.flush, keyValue);

    properties.push(property);
    return property;
  }

  map = <U>(project: (value: T | undefined) => U): JSX.Value<U> => {
    const mapper = new StateMap<T, U>(this as any, project, this.flush);
    const properties = this.properties ?? (this.properties = []);
    properties.push(mapper);
    return mapper;
  };
}

export class State<T> extends Value<T> {
  constructor(snapshot: T, public flush = (dirty: DirtyItem) => _flush(dirty)) {
    super(snapshot);
  }

  update = (valueOrUpdater: T | Updater<T>) => {
    const value =
      valueOrUpdater instanceof Function
        ? valueOrUpdater(this.snapshot)
        : valueOrUpdater;

    if (value) this.snapshot = value;
    this.flush(this);
  };
}

export function useState<T>(): State<T | undefined>;
export function useState<T>(value: T): State<T>;
export function useState(value?: any) {
  return new State(value);
}

class StateProperty<T, K extends keyof T> extends Value<T[K]> {
  constructor(
    public parent: Value<T>,
    public name: K,
    public flush: (dirty: DirtyItem) => boolean,
    value: T[K]
  ) {
    super(value);
  }

  update = (valueOrUpdater: T[K] | Updater<T[K]>) => {
    let newValue =
      valueOrUpdater instanceof Function
        ? valueOrUpdater(this.snapshot)
        : valueOrUpdater;

    let parent = this.parent;
    while (parent) {
      const parentValue = parent.snapshot;
      if (parentValue) {
        parentValue[this.name] = newValue as any;
        break;
      } else {
        parent.snapshot = newValue = { [this.name]: newValue } as any;
      }
      if (parent instanceof StateProperty) parent = parent.parent;
      else break;
    }

    this.flush(this);
  };
}

export class StateMap<T, U> extends Value<U> {
  constructor(
    public parent: { value: T },
    public project: (t: T) => U,
    public flush: (dirty: DirtyItem) => boolean
  ) {
    super(project(parent.value));
  }
}

type Updater<T> = (value?: T) => T | void;

type LinkedList<T> = null | { head: T; tail: LinkedList<T> };

export function _flush(item: DirtyItem) {
  const items: DirtyItem[] = [item];
  let root = item;
  while (root.parent) {
    root = root.parent;
    items.push(root);
  }

  const dirty = digest(items);
  for (const o of dirty as any) {
    o.next(o[_previous]);
  }
  return dirty.length > 0;
}

export type DirtyItem = {
  parent?: DirtyItem;
  snapshot?: any;
  [_previous]?: any;
  observers?: JSX.NextObserver<any>[];
  properties?: Value<any>[];
};

export function digest(root: DirtyItem[]) {
  type Dependency = { list: LinkedList<DirtyItem> };
  type StackItem = [DirtyItem, Dependency];
  const stack: StackItem[] = [];
  const dirty: { value?: any; observers: JSX.NextObserver<any>[] }[] = [];

  const rootDep: Dependency = { list: null };
  for (const r of root) stack.push([r, rootDep]);

  while (stack.length) {
    let [state, parentdependency] = stack.pop() as StackItem;

    const newValue = state.snapshot;
    const oldValue = state[_previous];
    let currdep: Dependency = { list: null };
    if (newValue !== oldValue) {
      state[_previous] = newValue;
      if (state.observers && state.observers.length) {
        for (const o of state.observers as any) {
          o[_previous] = newValue;
          dirty.push(o);
        }
      }
      let list = parentdependency.list;
      while (list) {
        for (const o of list.head.observers as any) {
          o[_previous] = newValue;
          dirty.push(o);
        }
        list = list.tail;
      }
      parentdependency.list = null;
    } else {
      currdep.list = { head: state, tail: parentdependency.list };

      if (state.observers && state.observers.length) {
        for (const o of state.observers as any) {
          if (o[_previous] !== newValue) {
            o[_previous] = newValue;
            dirty.push(o);
          }
        }
      }
    }

    const { properties } = state;
    if (properties) {
      let length = properties.length;
      if (newValue === null || newValue === undefined) {
        while (length--) {
          const p = properties[length];
          p.snapshot = null;
          stack.push([p, currdep]);
        }
      } else
        while (length--) {
          const p = properties[length];
          if (p instanceof StateProperty) {
            p.snapshot = newValue[p.name];
          } else if (p instanceof StateMap) {
            p.snapshot = p.project(newValue);
          }
          stack.push([p, currdep]);
        }
    }
  }

  return dirty;
}
