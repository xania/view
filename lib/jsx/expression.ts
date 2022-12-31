export enum ExpressionType {
  Property = 1,
  Function = 2,
  State = 3,
  Subscribable = 4,
  If = 4,
  Call = 5,
}

export function isExpression(value: any): value is JSX.Expression<any, any> {
  return (
    value &&
    value['type'] !== null &&
    value['type'] !== undefined &&
    (value.type === ExpressionType.State ||
      value.type === ExpressionType.Property ||
      value.type === ExpressionType.Function)
  );
}
