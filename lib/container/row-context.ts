import { ExpressionType } from '../expression';
import { TemplateType, ExpressionTemplate } from '../template';

export interface ViewContext {
  node: Node;
}

export function property<T>(name: keyof T & string): ExpressionTemplate {
  return {
    type: TemplateType.Expression,
    expression: {
      type: ExpressionType.Property,
      name,
    },
  };
}
// get<U>(getter: (row: T) => U) {
//   return function (context: { values: T }) {
//     if (context) return getter(context.values);
//     return null;
//   };
// }
export function call(func: (row: ViewContext) => void) {
  return function (context: ViewContext) {
    func(context);
  };
}
