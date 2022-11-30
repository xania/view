import { State } from '../state';
import { ExpressionType } from './expression';
import { isSubscribable } from '../util/is-subscibable';
import { Template, TemplateType } from './template';

type ViewContextFunction<T> = (
  t: JSX.State<T>,
  context: JSX.ViewContext<T>
) => any;

function expr(expr: JSX.Expression): Template {
  return {
    type: TemplateType.Expression,
    expr,
  };
}

export function useContext<T>() {
  return function (nameOrGetter: keyof T | ViewContextFunction<T>): Template {
    if (nameOrGetter instanceof Function)
      return expr({
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
      });
    else
      return expr({
        type: ExpressionType.Property,
        name: nameOrGetter,
      });
  };
}
