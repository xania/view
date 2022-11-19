import { ExpressionType } from './expression';
import { ExpressionTemplate, TemplateType } from './template';

function expr<T, U>(
  expression: ExpressionTemplate<T, U>['expression']
): ExpressionTemplate<T, U> {
  return {
    type: TemplateType.Expression,
    expression,
  };
}

export function useContext<T>() {
  return <U>(
    nameOrGetter: keyof T | JSX.FunctionExpression<T, U>['func'],
    ...deps: (keyof T)[]
  ) => {
    if (nameOrGetter instanceof Function)
      return expr<T, U>({
        type: ExpressionType.Function,
        func: nameOrGetter,
        deps,
      });
    else
      return expr<T, U>({
        type: ExpressionType.Property,
        name: nameOrGetter,
      });
  };
}
