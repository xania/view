import { ExpressionType } from './expression';
import { ExpressionTemplate, TemplateType } from './template';

function expr(
  expression: ExpressionTemplate['expression']
): ExpressionTemplate {
  return {
    type: TemplateType.Expression,
    expression,
  };
}

export function useContext<T = unknown>() {
  return (nameOrGetter: keyof T | Func<T, string>, ...deps: (keyof T)[]) => {
    if (nameOrGetter instanceof Function)
      return expr({
        type: ExpressionType.Function,
        func: nameOrGetter,
        deps,
      });
    else
      return expr({
        type: ExpressionType.Property,
        name: nameOrGetter,
      });
  };
}

type Func<T, U> = (t: T) => U;
