export enum ExpressionType {
  Property,
  Function,
}

export interface PropertyExpression {
  type: ExpressionType.Property;
  name: string | number | symbol;
}

export interface FunctionExpression {
  type: ExpressionType.Function;
  func: Function;
  deps: (string | number | symbol)[];
}

export type Expression = PropertyExpression | FunctionExpression;
