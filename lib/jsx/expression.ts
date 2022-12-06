export enum ExpressionType {
  Init = 0,
  Property = 1,
  State = 3,
  Curry = 5,
}

export function isExpression(value: any): value is JSX.Expression<any, any> {
  return (
    value &&
    value['type'] !== null &&
    value['type'] !== undefined &&
    (value.type === ExpressionType.Init ||
      value.type === ExpressionType.State ||
      value.type === ExpressionType.Property ||
      value.type === ExpressionType.Curry)
  );
}
