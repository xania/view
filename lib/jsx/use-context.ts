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
  return (nameOrGetter: keyof T | Function, ...deps: (keyof T)[]) => {
    if (typeof nameOrGetter === 'function')
      return expr({ type: ExpressionType.Function, func: nameOrGetter, deps });
    else
      return expr({
        type: ExpressionType.Property,
        name: nameOrGetter,
      });
  };
}
