/**
 * Signal is general representation of functions, 'takes' an input of type S and 'produces' T.
 *  Many times, we dont know what the input is, or don't want to depend on the input for purpose of
 *  separation of concern, T is produces as a scalar T, Promise of T or
 *  Observable of T (or in general a Monad of T to be more in line with definition
 *  of Arrow in category theory)
 *
 * We should not assume how 'takes' and 'produces' exactly works, the how is only determined by
 *  the underlying implementation of the rendering engine. Typically this possibly a function tho but it
 *  will be something else than an actual javascript function, in fact return is possibly be delayed
 *  in async scenario. Or an signal can represent '[prop]' or '[idx]' operation instead of calling a function
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

export class State<T, TParent extends State<any, any> | void = void> {
  public readonly graph: symbol;
  public readonly key: symbol;
  public readonly level: number;

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
      this.level = parent.level + 1;
    } else {
      this.graph = this.key;
      this.level = 0;
    }
  }

  map<U>(input: ArrowInput<T, U>): State<U, this> {
    const { initial } = this;
    if (input instanceof Composed) {
      const newValue = mapValue(initial, input.arrows);
      return new State(this.scope, newValue, this, input.arrows);
    }
    const other = toArrow(input);

    const newValue = mapValue(initial, [other]);

    return new State(this.scope, newValue, this, [other]);
  }
}

export function useState<T>(initial?: Value<T>) {
  return new State<T>(RootScope, initial);
}

type E<TState> = TState extends Arrow<any, infer T> ? T : never;

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

type ArrowInput<S, T> = Arrow<S, T> | ((s: S) => Value<T>);

function toArrow<S, T>(input: ArrowInput<S, T>): Arrow<S, T> {
  if (input instanceof Function) return new FuncArrow<S, T>(input);

  return input;
}

class Scope {}
const RootScope = new Scope();
