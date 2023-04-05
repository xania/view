import { UpdateStateCommand } from './commands';

export interface Stateful<T = any> {
  key: number;
  initial?: JSX.MaybePromise<T | undefined>;
}

export class State<T = any> implements Stateful<T> {
  public key: number = Math.random();

  constructor(public initial?: JSX.MaybePromise<T | undefined>) {}

  map<U>(mapper: (x: T) => JSX.MaybePromise<U>): StateMapper<T, U> {
    return new StateMapper<T, U>(this, mapper);
  }

  prop<K extends keyof T>(key: K): StateProperty<T, K> {
    return new StateProperty(this, key);
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
    public source: State<T>,
    public mapper: (x: T) => JSX.MaybePromise<U>
  ) {
    super(mapValue(source.initial, mapper));
  }
}

export class StateProperty<T, K extends keyof T> extends State<T[K]> {
  constructor(public source: State<T>, public name: K) {
    super(mapValue<T, T[K]>(source.initial, (x) => x[name]));

    this.key = source.key + hashCode(name as string);
  }
}

// export function map<T, U>(
//   x: JSX.MaybePromise<T | undefined>,
//   mapper: (x: T) => JSX.MaybePromise<U>
// ): JSX.MaybePromise<U | undefined> {
//   if (x === undefined) {
//     return undefined;
//   }
//   if (x instanceof Promise) {
//     return x.then((resolved) =>
//       resolved === undefined ? undefined : mapper(resolved)
//     );
//   }
//   return mapper(x);
// }

export function mapValue<T, U>(
  current: JSX.MaybePromise<T | undefined> | undefined,
  mapper: JSX.MaybePromise<U | undefined> | ((x: T) => JSX.MaybePromise<U>)
): JSX.MaybePromise<U | undefined> {
  if (mapper instanceof Function) {
    if (current === undefined) return undefined;
    if (current instanceof Promise) {
      return current.then((resolved) => mapValue(resolved, mapper));
    }
    return mapper(current);
  } else {
    return mapper;
  }
}

function hashCode(string: string) {
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
