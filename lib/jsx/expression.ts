export enum ExpressionType {
  Property = 1,
  Observable = 2,
}

export function isExpression(value: any): value is JSX.Expression {
  return (
    value &&
    value['type'] !== null &&
    value['type'] !== undefined &&
    (value.type === ExpressionType.Observable ||
      value.type === ExpressionType.Property)
  );
}
