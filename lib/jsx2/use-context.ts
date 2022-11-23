import { State } from '../state';
import { ExpressionType } from '../jsx/expression';
import { isSubscribable } from '../util/is-subscibable';

type ViewContextFunction<T> = (
  t: JSX.State<T>,
  context: JSX.ViewContext
) => any;

export function useContext<T>() {
  return function <U>(
    nameOrGetter: keyof T | ViewContextFunction<T>
  ): JSX.Expression<T, U> {
    if (nameOrGetter instanceof Function)
      return {
        type: ExpressionType.Init,
        init(values, context) {
          const result = nameOrGetter(values, context);
          if (result instanceof State)
            return {
              type: ExpressionType.State,
              state: result,
            };
          else if (isSubscribable(result)) {
            return {
              type: ExpressionType.State,
              state: result,
            };
          }
          return result;
        },
      };
    else
      return {
        type: ExpressionType.Property,
        name: nameOrGetter,
      };
  };
}
