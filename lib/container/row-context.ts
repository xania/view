import { ExpressionType } from '../expression';
import { TemplateType, ExpressionTemplate } from '../template';

export class RowContext<T> {
  property(name: keyof T & string): ExpressionTemplate {
    return {
      type: TemplateType.Expression,
      expression: {
        type: ExpressionType.Property,
        name,
      },
    };
  }
  get<U>(getter: (row: T) => U) {
    return function (context: { values: T }) {
      if (context) return getter(context.values);
      return null;
    };
  }
  remove(context: { dispose: Function }) {
    if (context?.dispose) context.dispose();
  }
  call(func: (row: T, target: Element) => void) {
    return function (context: { values: T }) {
      func(context.values, null as any);
    };
  }
}
