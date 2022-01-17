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
