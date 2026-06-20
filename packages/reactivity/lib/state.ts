/**
 * An arrow represents a transformation from an input of type `S` to an output
 * of type `T`.
 *
 * In many cases the input is not known ahead of time, or we intentionally do
 * not want to depend on it directly for separation-of-concerns reasons. The
 * output may be produced as a plain value, a `Promise<T>`, or another deferred
 * form.
 *
 * We should not assume how an arrow evaluates internally. That behavior is
 * determined by the rendering engine. In some cases it may wrap a JavaScript
 * function; in others it may represent deferred work or structural access such
 * as property or index selection.
 */

import type { Instruction } from './program';

export type Value<T> = JSX.MaybePromise<T | undefined | void>;

class ArrowBase<S = unknown, T = unknown> {
  get(_: S): Value<T> {
    throw Error('Not yet implemented');
  }
  map<U>(input: ArrowInput<T, U>): Arrow<S, U> {
    if (input instanceof Composed) {
      return new Composed<S, U>([this, ...input.arrows]);
    } else {
      const other = toArrow(input);
      return new Composed<S, U>([this, other]);
    }
  }
}

export interface Lense<T = any> {
  readonly key: symbol;
  readonly initial?: Value<T>;
  map<U>(func: Func<T, U>['func']): Func<T, U>;
}

export function isLense(l: any): l is Lense<any> {
  return l instanceof State || l instanceof Func || l instanceof ItemState;
}

export class State<T = any> implements Lense<T> {
  public readonly key: symbol = Symbol();

  constructor(
    public readonly scope: Scope,
    public readonly initial?: Value<T>
  ) {}

  map<U>(func: Func<T, U>['func']): Func<T, U> {
    const { initial } = this;

    const newValue = mapValue(initial, func);

    return new Func(this, func, newValue);
  }
}

export class ItemState<T> implements Lense<T> {
  public readonly key: symbol = Symbol();

  constructor(
    public readonly scope: Scope,
    public readonly list: Lense<T[]>
  ) {}

  map<U>(func: Func<T, U>['func']): Func<T, U> {
    return new Func(this, func);
  }
}

export class Func<T, U> implements Lense<U> {
  public readonly key: symbol = Symbol();

  constructor(
    public readonly parent: Lense<T>,
    public readonly func: (s: T) => Value<U>,
    public readonly initial: Value<U>
  ) {}

  map<S>(func: Func<U, S>['func']): Func<U, S> {
    const { initial } = this;
    const newValue = mapValue(initial, func);
    return new Func(this, func, newValue);
  }
}

export class FuncArrow<S, T> extends ArrowBase<S, T> {
  constructor(public func: (s: S) => Value<T>) {
    super();
  }

  get(input: S) {
    return this.func(input);
  }
}

function mapValue<T, U>(src: Value<T>, func: (s: T) => Value<U>): Value<any> {
  if (src === undefined) return undefined;
  if (src === null) return undefined;

  if (src instanceof Promise) {
    return src.then((resolved) => {
      if (resolved === undefined || resolved === null) return undefined;
      return func(resolved);
    });
  }

  return func(src);
}

class Composed<S, T> implements Arrow<S, T> {
  constructor(public arrows: Arrow<any, any>[]) {}

  get(_: S): Value<T> {
    throw Error('Not yet implemented');
  }

  map<U>(input: ArrowInput<T, U>): Arrow<S, U> {
    if (input instanceof Composed) {
      return new Composed<S, U>([...this.arrows, ...input.arrows]);
    }

    const other = toArrow(input);

    return new Composed<S, U>([...this.arrows, other]);
  }
}

export interface Arrow<S = unknown, T = unknown> {
  map<U>(input: ArrowInput<T, U>): Arrow<S, U>;
}

type ArrowInput<S, T> = Arrow<S, T> | ((s: S, prev?: S) => Value<T>);

function toArrow<S, T>(input: ArrowInput<S, T>): Arrow<S, T> {
  if (input instanceof Function) return new FuncArrow<S, T>(input);

  return input;
}

export class Scope {
  public events?: Map<State, Instruction[]>;
  public values: Record<symbol, any> = {};

  constructor(public level: number) {}

  pushScope() {
    const { level } = this;
    const newScope = new Scope(level + 1);
    return newScope;
  }

  state<T>(): State<T>;
  state<T>(initial: Promise<T>): State<T>;
  state<T>(initial: T): State<T>;
  state<T>(initial?: Value<T>) {
    return new State<T>(this, initial);
  }
}

export const RootScope = new Scope(0); // root scope

export function useState<T>(initial: Promise<T>): State<T>;
export function useState<T>(initial: T): State<T>;
export function useState<T>(initial?: Value<T>) {
  return new State<T>(RootScope, initial);
}

export function resolveRootState(lense: Lense<any>): State {
  while (!(lense instanceof State)) {
    if (lense instanceof Func) {
      lense = lense.parent;
    } else if (lense instanceof ItemState) {
      return lense;
    } else {
      throw new Error('Resolve root state failed: not supported lense');
    }
  }
  return lense;
}
