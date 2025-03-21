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

import { currentScope, Scope } from './scope';

export type Value<T> = JSX.MaybePromise<T | undefined | void>;

export class Signal<S = unknown, T = unknown> {
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

export class State<TParent extends State<any, any> | void, T = any>
  implements Arrow<void, T>
{
  public readonly graph: symbol;
  public readonly scope: Scope;
  public readonly key: symbol;
  public readonly level: number;

  constructor(initial: Value<T>);
  constructor(initial: Value<T>, parent: TParent, arrows: Arrow[]);
  constructor(
    readonly initial: Value<T>,
    readonly parent?: TParent,
    readonly arrows?: Arrow[]
  ) {
    this.scope = parent?.scope ?? currentScope;
    this.graph = parent?.graph ?? Symbol();
    this.level = parent ? parent.level + 1 : 0;
    this.key = Symbol();
  }

  get(_: void): Value<T> {
    return this.initial;
  }

  map<U>(input: ArrowInput<T, U>): State<this, U> {
    const { initial } = this;
    if (input instanceof Composed) {
      const newValue = mapValue(initial, input.arrows);
      return new State<this, U>(newValue, this, input.arrows);
    }
    const other = toArrow(input);

    const newValue = mapValue(initial, [other]);

    return new State<this, U>(newValue, this, [other]);
  }

  bind<U>(other: State<any, U>): BoundState<this, typeof other> {
    throw Error('Not supported just Yet!');
  }
}

export function useSignal<S, T>(fn: (s: S) => T): Signal<S, T> {
  return new FuncArrow(fn);
}

export function useState<T>(initial?: Value<T>) {
  return new State<undefined, T>(initial);
}

type E<TState> = TState extends Arrow<any, infer T> ? T : never;

export class BoundState<TState1, TState2>
  implements Arrow<void, [E<TState1>, E<TState2>]>
{
  constructor(
    public s1: TState1,
    public s2: TState2
  ) {}

  get(_: void): [E<TState1>, E<TState2>] {
    throw new Error('Method not implemented.');
  }

  map<U>(input: ArrowInput<[E<TState1>, E<TState2>], U>): State<void, U> {
    return new State<void, U>(undefined, undefined, [toArrow(input)]);
  }
}
export class FuncArrow<S, T> extends Signal<S, T> {
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
  get(s: S): Value<T>;
  map<U>(input: ArrowInput<T, U>): Arrow<S, U>;
}

type ArrowInput<S, T> = Arrow<S, T> | ((s: S) => Value<T>);

function toArrow<S, T>(input: ArrowInput<S, T>): Arrow<S, T> {
  if (input instanceof Function) return new FuncArrow<S, T>(input);

  return input;
}
