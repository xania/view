import { Command, UpdateStateCommand } from './command';

export type Value<T = any> = JSX.MaybePromise<T | undefined | void>;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Unwrap<T> = Exclude<UnwrapPromise<T>, undefined | void>;

export class Reactive<T = any> {
  constructor(public initial?: Value<T>, public key: symbol = Symbol()) {
    if (initial instanceof Promise) {
      /**
       * In xania reactivity system, x and Promise of x are the same and interchangable
       */
      initial.then((value) => {
        this.initial = value;
      });
    }
  }

  map<U>(fn: (x: T) => Value<U>, defaultValue?: U): Computed<T, U> {
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

  zip<U extends [...Reactive<any>[]]>(
    ...sources: [...U]
  ): Zip<[T, ...UnwrapSources<U>]>;
  zip(...sources: Reactive<any>[]): Zip<any> {
    return new Zip([this, ...sources]);
  }

  update(
    valueOrCompute: UpdateStateCommand<T>['valueOrCompute']
  ): UpdateStateCommand {
    return new UpdateStateCommand(this, valueOrCompute);
  }

  toString() {
    return this.initial;
  }
}

type UnwrapSources<T extends [...any[]]> = T extends []
  ? []
  : T extends [infer H, ...infer Tail]
  ? [UnwrapSource<H>, ...UnwrapSources<Tail>]
  : [3, T];
type UnwrapSource<T> = T extends Reactive<infer U> ? U : never;

type KeyOfType<O, T> = {
  [P in keyof O]: T extends O[P] ? P : never;
}[keyof O];

export class Zip<T extends any[] = any> extends Reactive<T> {
  constructor(public sources: Reactive[]) {
    super(zipInitial(sources, [], 0) as T);
  }

  get dependencies() {
    return this.sources;
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

export class Effect<T = any, R = any> {
  public key: symbol = Symbol();
  constructor(
    public state: Reactive<T>,
    public effect: (value: T, acc?: R | undefined) => Value<R>
  ) {}
}

export class Property<T = any, P extends keyof T = any> extends Reactive<
  Unwrap<T[P]>
> {
  constructor(public parent: Reactive<T>, public name: P) {
    super(mapValue(parent.initial, (value) => value[name]));
  }
}

export class Computed<T = any, U = any> extends Reactive<Unwrap<U>> {
  constructor(
    public parent: Reactive<T>,
    public compute: (x: T) => Value<U>,
    public defaultValue?: U
  ) {
    super(mapValue<T, U>(parent.initial, compute));
  }
}

interface List<T> {
  add(...values: T[]): unknown;
  remove(...values: T[]): unknown;
}
export class Append<T = any> {
  public key: symbol = Symbol('append');
  constructor(public state: Reactive<T[]>, public list: List<T>) {}
}

export function mapValue<T, U>(
  input: Value<T>,
  f: (x: T) => Value<U>
): Value<Unwrap<U>> {
  if (input instanceof Promise) {
    return input.then((resolved) => mapValue(resolved, f));
  } else if (input !== undefined) {
    return f(input) as Unwrap<U>;
  }
}

export function mapValues<T extends any[]>(
  inputs: Value<any>[],
  project?: (x: T) => any
): any {
  const values: any = inputs.slice(0);
  const promises = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input instanceof Promise) {
      promises.push(input.then((x) => (values[i] = x)));
    }
  }

  if (!project) {
    return values;
  }

  if (promises.length) {
    return Promise.all(promises).then(() => project.apply(null, values));
  }

  return project.apply(null, values);
}

function zipInitial(
  sources: Reactive<any>[],
  result: any[],
  offset: number
): any[] | Promise<any[]> {
  for (let i = offset; i < sources.length; i++) {
    const sourceValue = sources[i].initial;
    if (sourceValue instanceof Promise) {
      return sourceValue.then((x) => {
        result[i] = x;
        return zipInitial(sources, result, offset + 1);
      });
    }
    result[i] = sources[i].initial;
  }

  return result;
}
