/**
 * Signal is general representation of functions 'takes' an input of type S and 'produces' T.
 *  Many times, we dont know what the input is, or don't want to depend on the input for purpose of
 *  separation of concern
 *
 * We should not assume how 'takes' and 'produces' exactly works, the how is only determined by
 *  the underlying implementation of the rendering engine. Typically this possibly a function tho but it
 *  will be something else than an actual javascript function, in fact return is possibly be delayed
 *  in async scenario. Or an signal can represent '[prop]' or '[idx]' operation instead of calling a function
 */

export type Value<T> = JSX.MaybePromise<T | undefined | void>;

export abstract class Signal<S = unknown, T = unknown> {
  public readonly key: symbol = Symbol();
  public readonly signals?: Signal[];

  // abstract get(source: S): Value<T>;

  map<U>(func: (x: T) => U): Signal<S, U> {
    return this.compose(new FuncSignal(func));
  }

  abstract compose<U>(other: Signal<T, U>): Signal<S, U>;

  // compose<U>(arr2: Signal<T, U>): Signal<S, U> {
  //   const arr1 = this;

  //   const composed: any = [];
  //   if (arr1 instanceof Composed) {
  //     composed.push(...arr1.signals);
  //   } else {
  //     composed.push(arr1);
  //   }
  //   if (arr2 instanceof Composed) {
  //     composed.push(...arr2.signals);
  //   } else {
  //     composed.push(arr2);
  //   }
  //   return new Composed(composed);
  // }
}

export class State<T> extends Signal<void, T> {
  constructor(readonly initial?: Value<T>) {
    super();
  }

  compose<U>(other: Signal<T, U>): State<U> {
    const { initial } = this;

    const newValue = mapValue(initial, other);

    return new State<U>(newValue);
  }

  get(): Value<T> {
    return this.initial;
  }
}

export function useSignal<S, T>(fn: (s: S) => T): Signal<S, T> {
  return new FuncSignal(fn);
}

export function useState<T>(initial?: T) {
  return new State(initial);
}

export class Composed<S, T> extends Signal<S, T> {
  constructor(public readonly signals: Signal[]) {
    super();
  }

  compose<U>(other: Signal<T, U>): Signal<S, U> {
    throw new Error('Method not implemented.');
  }

  // get(input: S): Value<T> {
  //   let output: any = input;
  //   const { signals } = this;

  //   for (let i = 0; i < signals.length; i++) {
  //     const signal = signals[i];
  //     if (output instanceof Promise) {
  //       output = output.then(signal.get);
  //     }
  //     output = signals[i].get(output);
  //   }

  //   return output;
  // }
}

class FuncSignal<S, T> extends Signal<S, T> {
  constructor(public func: (s: S) => Value<T>) {
    super();
  }

  compose<U>(other: Signal<T, U>): Signal<S, U> {
    throw new Error('Method not implemented.');
  }

  get(input: S) {
    return this.func(input);
  }
}

function mapValue<T, U>(initial: Value<T>, signal: Signal<T, U>): Value<U> {
  if (initial === undefined) return undefined;
  if (initial === null) return undefined;

  if (initial instanceof Promise) {
    return initial.then((x) => mapValue(x, signal));
  }

  let retval = initial;
  if (signal instanceof FuncSignal) {
    retval = signal.func(retval);
  } else if (signal instanceof Composed) {
  } else throw new Error('');
}
