export enum ExpressionType {
  Property = 1,
  Function = 2,
  State = 3,
  Promise = 4,
}

export function isExpression(value: any): value is JSX.Expression<any, any> {
  return (
    value &&
    value['type'] &&
    (value.type === ExpressionType.Function ||
      value.type === ExpressionType.State ||
      value.type === ExpressionType.Property ||
      value.type === ExpressionType.Promise)
  );
}
