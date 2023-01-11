import { notify } from '../rx';
import { ViewContext } from './element';
import { Expression, ExpressionType } from './expression';

export class Context<T> {
  lazy<U>(value: U) {
    return new Lazy<T, U>(value);
  }

  readonly(name: keyof T) {
    return this.get(name, true);
  }

  get(name: keyof T, readonly: boolean = false): Expression {
    return {
      type: ExpressionType.Property,
      name,
      readonly,
    };
  }

  map<U>(func: (c: T) => U): Expression {
    return {
      type: ExpressionType.Function,
      func,
    };
  }
}

export class Lazy<T, U> {
  constructor(public value: U) {}

  attachables: [HTMLElement, Function][] = [];

  select(context: T) {
    notify(this, [context, this.value]);
    return () => {
      notify(this, [context, null]);
    };
  }

  attach(func: (x: ViewContext<T>) => void) {
    const { attachables } = this;
    return {
      attachTo(x: HTMLElement) {
        attachables.push([x, func]);
      },
    };
  }
}

export function useContext<T>() {
  return new Context<T>();
}
