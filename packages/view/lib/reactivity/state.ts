import { UpdateStateCommand } from './command';
import { OperatorType } from './operator';

export type Value<T = any> = undefined | T | Promise<T | undefined>;

export function state<T>(value?: T) {
  return new State<T>(value);
}

export class State<T = any> {
  constructor(public readonly initial?: Value<T>) {}

  prop<P extends keyof T>(name: P): Property<T, P> {
    return ((this as any)[name] ??= new Property(this, name));
  }

  get = this.prop;

  map<U>(fn: (x: T) => Value<Unwrap<U>>): Computed<T, U> {
    return new Computed(this, fn);
  }

  effect(fn: (value: T) => void): Effect {
    return new Effect(this, fn);
  }

  update(valueOrCompute: UpdateStateCommand<T>['valueOrCompute']) {
    return new UpdateStateCommand(this, valueOrCompute);
  }

  true<U>(trueValue: Value<Unwrap<U>>) {
    return this.map<U | null>((x) => (x ? trueValue : null));
  }

  false<U>(trueValue: Value<Unwrap<U>>) {
    return this.map<U | null>((x) => (!x ? trueValue : null));
  }

  toggle<U>(tru: Value<Unwrap<U>>, fals: Value<Unwrap<U>>) {
    return this.map((x) => (x ? tru : fals));
  }

  pipe<U>(f: (x: this) => U) {
    return f(this);
  }
}

type Unwrap<T> = T extends Promise<infer U> ? U : T;

export class Property<T, P extends keyof T> extends State<Unwrap<T[P]>> {
  constructor(public parent: State<T>, public name: P) {
    super(
      Computed.compute<T, T[P]>(
        parent.initial,
        (obj) => obj[name] as Unwrap<T[P]>
      )
    );
  }
}

export class Computed<T, U> extends State<Unwrap<U>> {
  constructor(
    public source: State<T>,
    public compute: (x: T) => Value<Unwrap<U>>
  ) {
    super(Computed.compute<T, U>(source.initial, compute));
  }

  static compute<T, U>(
    object: Value<T>,
    map: (x: T) => Value<Unwrap<U>>,
    defaultValue?: Value<Unwrap<U>>
  ): Value<Unwrap<U>> {
    if (object === null || object === undefined) {
      return defaultValue;
    }
    if (object instanceof Promise) {
      return object.then((resolved) => Computed.compute(resolved, map));
    } else {
      return map(object);
    }
  }
}

export class Effect<T = any> {
  public readonly type = OperatorType.Effect;
  constructor(public state: State, public effect: (value: T) => void) {}
}
