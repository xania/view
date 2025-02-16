/**
 * Arrow is general representation of functions 'takes' an input of type T and 'produces',
 *  Many times, we dont know what the input is, or don't want to depend on the input for purpose of
 *  separation of concern
 *
 * For practical reasons when using typescript Arrow is defined as an interface type with empty body.
 *
 * We should not assume how 'takes' and 'produces' exactly works, the how is only determined by
 *  the underlying implementation of the rendering engine. Typically this possibly a function tho but it
 *  will be something else than an actual javascript function, in fact return is possibly be delayed
 *  in async scenario. Or an arraw can represent '[prop]' or '[idx]' operation instead of calling a function
 */

export type Value<T> = JSX.MaybePromise<T | undefined | void>;

export interface Arrow<_S = unknown, _T = unknown> {}

export class Signal<S, T> implements Arrow<S, T> {
  constructor(public call: (s: S) => T) {}
}

export class State<T> implements Arrow<void, T> {
  constructor(readonly initial?: Value<T>) {}
}

export function useState<T>(initial?: T) {
  return new State(initial);
}

export function compose<C extends any[], U>(
  arr1: Composed<C>,
  arr2: Arrow<Right<Last<C>>, U>
): Composed<[...C, Arrow<Right<Last<C>>, U>]>;
export function compose<T, C extends any[]>(
  arr1: Arrow<T, Left<First<C>>>,
  arr2: Composed<C>
): Composed<[Arrow<T, Left<First<C>>>, ...C]>;
export function compose<S, T, U>(
  arr1: Arrow<S, T>,
  arr2: Arrow<T, U>
): Composed<[Arrow<S, T>, Arrow<T, U>]>;
export function compose(arr1: Arrow, arr2: Arrow): any {
  const arr: any = [];

  if (arr1 instanceof Composed) {
    arr.push(...arr1.arrows);
  } else {
    arr.push(arr1);
  }

  if (arr2 instanceof Composed) {
    arr.push(...arr2.arrows);
  } else {
    arr.push(arr2);
  }

  return new Composed(arr);
}

class Composed<TArrows extends Arrow[]>
  implements Arrow<Left<First<TArrows>>, Right<Last<TArrows>>>
{
  constructor(public readonly arrows: TArrows) {}
}

const s = new Signal((s: number) => s.toString());
const c = new Composed([s]);

const c1: Arrow<number, number> = compose(c, new State(1));

// type utils
type Left<T> = T extends Arrow<infer L, infer _> ? L : never;
type Right<T> = T extends Arrow<infer _, infer R> ? R : never;
type Last<T extends any[]> = T extends [...infer _, infer L] ? L : never;
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type AsArrows<T extends any[]> = T extends [
  infer First,
  infer Second,
  ...infer Rest,
]
  ? [Arrow<First, Second>, ...AsArrows<[Second, ...Rest]>]
  : T;
