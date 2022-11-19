import { ExpressionType } from '../jsx/expression';

export function useContext<T>() {
  return function <U>(
    nameOrGetter: keyof T | JSX.FunctionExpression<T, U>['func'],
    ...deps: (keyof T)[]
  ): JSX.Expression<T, U> {
    if (nameOrGetter instanceof Function)
      return {
        type: ExpressionType.Function,
        func: nameOrGetter,
        deps,
      };
    else
      return {
        type: ExpressionType.Property,
        name: nameOrGetter,
      };
  };
}
