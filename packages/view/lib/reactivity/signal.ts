import { UpdateStateCommand } from './command';
import { CallOperator, GetOperator, Operator, OperatorEnum } from './graph';
import { Program } from './program';

export class Signal<T = any> {
  public readonly key: symbol = Symbol();

  constructor(
    public program: Program,
    public initial?: Value<T>
  ) {}

  map<U>(fn: (x: T) => Value<U>): Computed<T> {
    const computed = new Computed(this, fn);

    const { program } = this;
    program.instructions.push(computed);
    program.operators.push({
      type: OperatorEnum.Call,
      source: this.key,
      target: computed.key,
      func: computed.compute,
      context: null,
    } satisfies CallOperator);

    return computed;
  }

  prop<P extends keyof T>(name: P): Property<T, P> {
    const property = ((this as any)[name] ??= new Property(this, name));

    const { graph } = this;
    graph.nodes.push(property);
    graph.operators.push({
      type: OperatorEnum.Prop,
      source: this.key,
      target: property.key,
      prop: name,
    } satisfies GetOperator);

    return property;
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

  combineLatest<U extends [...Signal<any>[]]>(
    ...sources: [...U]
  ): CombineLatest<[T, ...UnwrapSources<U>]>;
  combineLatest(...sources: Signal<any>[]): CombineLatest<any> {
    return new CombineLatest(this.graph, [this, ...sources]);
  }

  bind<U extends [...Signal<any>[]]>(
    ...sources: [...U]
  ): BoundState<[T, ...UnwrapSources<U>]>;
  bind(...sources: Signal<any>[]): BoundState<any> {
    const bound = new BoundState(this.graph, [this, ...sources]);

    const { graph } = this;

    for (const each of sources) {
      if (each.graph === graph) {
      }
    }

    graph.nodes.push(bound);
    return bound;
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

export type Value<T = any> = JSX.MaybePromise<T | undefined | void>;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Unwrap<T> = Exclude<UnwrapPromise<T>, undefined | void>;

type UnwrapSources<T extends [...any[]]> = T extends []
  ? []
  : T extends [infer H, ...infer Tail]
    ? [UnwrapSource<H>, ...UnwrapSources<Tail>]
    : [3, T];
type UnwrapSource<T> = T extends Signal<infer U> ? U : never;

type KeyOfType<O, T> = {
  [P in keyof O]: T extends O[P] ? P : never;
}[keyof O];

export class CombineLatest<T extends any[] = any> extends Signal<T> {
  public joinKey = Symbol(new Date().getTime());
  constructor(
    graph: Composed,
    public sources: Signal[]
  ) {
    super(graph, combineInitial(sources, [], 0) as T);
  }
}

export class BoundState<T extends any[] = any> extends Signal<T> {
  constructor(
    graph: Composed,
    public sources: Signal[]
  ) {
    super(graph, combineInitial(sources, [], 0) as T);
  }
}

export class When<U = any> extends Signal<U> {
  constructor(
    public condition: Signal<boolean>,
    public tru?: U,
    public fals?: U
  ) {
    super(condition.graph);
  }
}

export class Assign<T = any, U = any, P extends KeyOfType<U, T> = any> {
  constructor(
    public state: Signal<T>,
    public target: U,
    public property: P
  ) {}
}

export class Effect<T = any, R = any> {
  public key: symbol = Symbol();
  constructor(
    public state: Signal<T>,
    public effect: (value: T, acc?: R | undefined) => Value<R>
  ) {}
}

export class Property<T = any, P extends keyof T = any> extends Signal<T[P]> {
  constructor(
    public parent: Signal<T>,
    public name: P
  ) {
    super(parent.graph, mapValue(parent.initial, name));
  }
}

export class Computed<T = any, U = any> extends Signal<Unwrap<U>> {
  constructor(
    public parent: Signal<T>,
    public compute: (x: T) => Value<U>
  ) {
    super(parent.graph, mapValue<T, U>(parent.initial, compute));
  }
}

interface List<T> {
  add(...values: T[]): unknown;
  remove(...values: T[]): unknown;
}
export class Append<T = any> {
  public key: symbol = Symbol('append');
  constructor(
    public state: Signal<T[]>,
    public list: List<T>
  ) {}
}

export function mapValue<T, U>(
  input: Value<T>,
  f: (x: T) => Value<U>
): Value<Unwrap<U>>;
export function mapValue<T, K extends keyof T>(
  input: Value<T>,
  prop: K
): Value<T[K]>;
export function mapValue(input: Value, f: any): Value<any> {
  if (input instanceof Promise) {
    return input.then((resolved) => mapValue(resolved, f));
  } else if (input !== undefined) {
    return f instanceof Function ? f(input) : input[f];
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

function combineInitial(
  sources: Signal<any>[],
  result: any[],
  offset: number
): any[] | Promise<any[]> {
  for (let i = offset; i < sources.length; i++) {
    const sourceValue = sources[i].initial;
    if (sourceValue instanceof Promise) {
      return sourceValue.then((x) => {
        result[i] = x;
        return combineInitial(sources, result, offset + 1);
      });
    }
    result[i] = sources[i].initial;
  }

  return result;
}

export class State<T = any> extends Signal<T> {
  dependencies?: undefined = undefined;
}

// export class Graph {
//   readonly nodes: Signal[] = [];
//   readonly operators: Operator[] = [];

//   state<T = unknown>(): State<T>;
//   state<T>(intial: Value<T>): State<T>;
//   state<T>(initial?: Value<T>) {
//     const s = new State(this, initial);
//     this.nodes.push(s);
//     return s;
//   }
// }
