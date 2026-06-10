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

export class State<T = any, TParent extends State<any, any> | void = void> {
  public readonly graph: symbol;
  public readonly key: symbol;

  constructor(scope: Scope, initial: Value<T>);
  constructor(
    scope: Scope,
    initial: Value<T>,
    parent: TParent,
    arrows: Arrow[]
  );
  constructor(
    public readonly scope: Scope,
    public readonly initial: Value<T>,
    public readonly parent?: TParent,
    public readonly arrows?: Arrow[]
  ) {
    this.key = Symbol();
    if (parent) {
      this.scope = parent.scope;
      this.graph = parent.graph;
    } else {
      this.graph = this.key;
    }
  }

  map<U>(input: ArrowInput<T, U>): State<U, this> {
    const { initial } = this;
    if (input instanceof Composed) {
      const newValue = mapValue(initial, input.arrows);
      return new State(this.scope, newValue, this, input.arrows);
    }

    const others = [toArrow(input)];
    const newValue = mapValue(initial, others);

    return new State(this.scope, newValue, this, others);
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

function mapValue<T>(
  retval: Value<T>,
  arrows: Arrow[],
  offset: number = 0
): Value<any> {
  if (retval === undefined) return undefined;
  if (retval === null) return undefined;

  for (let i = offset; i < arrows.length; i++) {
    if (retval instanceof Promise) {
      return retval.then((x) => mapValue(x, arrows, i));
    }

    const arr = arrows[i];
    if (arr instanceof FuncArrow) {
      retval = arr.func(retval);
    } else if (arr instanceof Composed) {
      retval = mapValue(retval, arr.arrows, 0);
    } else throw new Error('');
  }

  return retval;
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
