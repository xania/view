export interface Stateful<T = any> {
  dependencies?: JSX.MaybeArray<Stateful>;
  initial?: T;
}

export class State<T = any> implements Stateful<T> {
  constructor(public readonly initial?: T) {}

  map<U>(
    mapper: (x: T) => JSX.MaybePromise<U>
  ): JSX.MaybePromise<MappedState<T, U>> {
    const { initial } = this;
    const mappedInitial = initial !== undefined ? mapper(initial) : undefined;
    if (mappedInitial instanceof Promise) {
      return mappedInitial.then(
        (resolved) => new MappedState(this, mapper, resolved)
      );
    }
    return new MappedState<T, U>(this, mapper, mappedInitial);
  }

  toggle(tru: boolean, fals: boolean) {
    return this.map((x) => (x ? tru : fals));
  }
}

export class MappedState<T, U> {
  constructor(
    public source: Stateful<T>,
    public mapper: (x: T) => JSX.MaybePromise<U>,
    public initial?: U
  ) {}
}
