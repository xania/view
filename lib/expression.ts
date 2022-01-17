export enum ExpressionType {
  Property,
  Function,
}

export interface PropertyExpression {
  type: ExpressionType.Property;
  name: string;
}

export interface FunctionExpression {
  type: ExpressionType.Function;
  observable: Expression;
}

export type Expression = PropertyExpression | FunctionExpression;
