import { UpdateStateCommand } from './commands';

export interface Stateful<T = any> {
  initial?: JSX.MaybePromise<T | undefined>;
}

export class State<T = any> implements Stateful<T> {
  // cache properties so that a single StateProperty instance is created for each unique property key.
  // update command can target this instance to identify necessary changes.
  properties?: { [P in keyof T]?: StateProperty<T, P> };

  constructor(public initial?: JSX.MaybePromise<T | undefined>) {}

  map<U>(mapper: (x: T) => JSX.MaybePromise<U>): StateMapper<T, U> {
    return new StateMapper<T, U>(this, mapper);
  }

  prop<K extends keyof T>(key: K): StateProperty<T, K> {
    const properties: this['properties'] =
      this.properties ?? (this.properties = {});

    const prop = properties[key];
    if (prop) return prop;

    const sp = new StateProperty(this, key);
    properties[key] = sp;

    return sp;
  }
  get = this.prop;

  toggle<U>(tru: U, fals: U) {
    return this.map((x) => (x ? tru : fals));
  }

  update(valueOrUpdater: UpdateStateCommand<T>['updater']) {
    return new UpdateStateCommand<T>(this, valueOrUpdater);
  }

  effect(fn: (value: T) => void) {
    return new StateEffect(this, fn);
  }
}

export class StateEffect<T = any> {
  constructor(public state: Stateful, public effect: (value: T) => void) {}
}

export class StateMapper<T, U> extends State<U> {
  constructor(
    public source: Stateful<T>,
    public mapper: (x: T) => JSX.MaybePromise<U>
  ) {
    super(map(source.initial, mapper));
  }
}

export class StateProperty<T, K extends keyof T> extends State<T[K]> {
  constructor(public source: Stateful<T>, public name: K) {
    super(map(source.initial, (x) => x[name]));
  }
}

export function map<T, U>(
  x: JSX.MaybePromise<T | undefined>,
  mapper: (x: T) => JSX.MaybePromise<U>
): JSX.MaybePromise<U | undefined> {
  if (x === undefined) {
    return undefined;
  }
  if (x instanceof Promise) {
    return x.then((resolved) =>
      resolved === undefined ? undefined : mapper(resolved)
    );
  }
  return mapper(x);
}
