export type Value<T = any> = T | Promise<T>;
export type Unwrap<T> = T extends Promise<infer U> ? U : T;

export class Reactive<T = any> {
  map<U>(fn: (x: T) => Value<Unwrap<U>>, defaultValue?: U): Computed<T, U> {
    return new Computed(this, fn, defaultValue);
  }

  prop<P extends keyof T>(name: P): Property<T, P> {
    return ((this as any)[name] ??= new Property(this, name));
  }

  get<P extends keyof T>(name: P): Property<T, P> {
    return this.prop(name);
  }

  assign<U, P extends KeyOfType<U, T>>(target: U, property: P) {
    return new Assign<T, U, P>(this, target, property);
  }

  effect<R>(fn: (value: T, acc?: R | undefined) => Value<R>): Effect {
    return new Effect<T, R>(this, fn);
  }

  pipe<U>(f: (x: this) => U) {
    return f(this);
  }

  when<U>(value: T, tru: U, fals: U): When<T, U> {
    return new When(this, value, tru, fals);
  }

  join<U>(other: Reactive<U>): Join<[T, U]>;
  join<U, R>(
    other: Reactive<U>,
    project: (...args: [T, U]) => R
  ): Join<[T, U], R>;
  join(other: Reactive<any>, project?: any): Join<any, any> {
    const sources: Reactive[] = [];
    if (this instanceof Join) {
      sources.push(...this.sources);
    } else {
      sources.push(this);
    }

    if (other instanceof Join) {
      sources.push(...other.sources);
    } else {
      sources.push(other);
    }
    return new Join(sources, project);
  }
}

type KeyOfType<O, T> = {
  [P in keyof O]: T extends O[P] ? P : never;
}[keyof O];

export class Join<T extends any[] = any, R = T> extends Reactive<R> {
  constructor(
    public sources: Reactive[],
    public project?: (values: T) => Value<R>
  ) {
    super();
  }
}

export class When<T = any, U = any> extends Reactive<U> {
  constructor(
    public state: Reactive<T>,
    public value: T,
    public tru: U,
    public fals: U
  ) {
    super();
  }
}

export class Assign<T = any, U = any, P extends KeyOfType<U, T> = any> {
  constructor(
    public state: Reactive<T>,
    public target: U,
    public property: P
  ) {}
}

export class Model<T> extends Reactive<T> {}

export class Effect<T = any, R = any> {
  constructor(
    public state: Reactive<T>,
    public effect: (value: T, acc?: R | undefined) => Value<R>
  ) {}
}

export class Property<T = any, P extends keyof T = any> extends Reactive<
  Unwrap<T[P]>
> {
  constructor(public parent: Reactive<T>, public name: P) {
    super();
  }
}

export class Computed<T = any, U = any> extends Reactive<Unwrap<U>> {
  constructor(
    public input: Reactive<T>,
    public compute: (x: T) => Value<Unwrap<U>>,
    public defaultValue?: U
  ) {
    super();
  }
}

interface List<T> {
  add(...values: T[]): unknown;
  remove(...values: T[]): unknown;
}
export class Append<T = any> {
  constructor(public state: Reactive<T[]>, public list: List<T>) {}
}
