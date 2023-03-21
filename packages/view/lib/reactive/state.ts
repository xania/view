export interface Stateful<T = any> {
  dependencies?: JSX.MaybeArray<Stateful>;
  initial?: T;
}

export class State<T = any> implements Stateful<T> {
  constructor(public readonly initial?: T) {}

  map<U>(mapper: (x: T) => U): MappedState<T, U> {
    return new MappedState<T, U>(this, mapper);
  }
}

export class MappedState<T, U> implements Stateful<U> {
  public initial?: U;
  constructor(public source: Stateful<T>, public mapper: (x: T) => U) {
    const { initial } = source;
    this.initial = initial !== undefined ? mapper(initial) : undefined;
  }
}
