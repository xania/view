import { notify } from '../rx';
import { ExpressionType } from './expression';
import { Template, TemplateType } from './template';

export class Context<T> {
  defer<U>(value: U) {
    return new Deferred(value);
  }

  readonly(name: keyof T) {
    return this.get(name, true);
  }

  get(name: keyof T, readonly: boolean = false) {
    return expr({
      type: ExpressionType.Property,
      name,
      readonly,
    });
  }
}

export class Deferred<T, U> {
  constructor(public value: U) {}

  select(context: T) {
    notify(this, [context, this.value]);
  }
}

function expr(expr: JSX.Expression): Template {
  return {
    type: TemplateType.Expression,
    expr,
  };
}

export function useContext<T>() {
  return new Context<T>();
}
