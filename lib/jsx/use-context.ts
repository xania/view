import { ExpressionType } from './expression';
import { ExpressionTemplate, TemplateType } from './template';

function expr<T>(
  expression: ExpressionTemplate<T>['expression']
): ExpressionTemplate<T> {
  return {
    type: TemplateType.Expression,
    expression,
  };
}

export function useContext<T = unknown>() {
  return (
    nameOrGetter: keyof T | JSX.FunctionExpression<T>['func'],
    ...deps: (keyof T)[]
  ) => {
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
