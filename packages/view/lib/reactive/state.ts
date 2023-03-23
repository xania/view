﻿import { UpdateCommand } from './update';

export interface Stateful<T = any> {
  initial?: JSX.MaybePromise<T | undefined>;
}

export class State<T = any> implements Stateful<T> {
  constructor(public readonly initial?: JSX.MaybePromise<T | undefined>) {}

  update(updater: (x: T) => T) {
    return new UpdateCommand(this, updater);
  }

  map<U>(mapper: (x: T) => JSX.MaybePromise<U>): StateMapper<T, U> {
    return new StateMapper<T, U>(this, mapper);
  }

  prop<K extends keyof T>(key: K): StateMapper<T, T[K]> {
    return new StateMapper<T, T[K]>(this, (obj) => obj[key]);
  }

  toggle(tru: boolean, fals: boolean) {
    return this.map((x) => (x ? tru : fals));
  }
}

export class StateMapper<T, U> extends State<U> {
  constructor(
    public source: Stateful<T>,
    public mapper: (x: T) => JSX.MaybePromise<U>
  ) {
    super(map(source.initial, mapper));
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