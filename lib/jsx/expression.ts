import { Observable } from './observables';

export enum ExpressionType {
  Property = 3563461,
  Function = 3563462,
  Observable = 3563463,
}

export type Expression<T = any> =
  | ObservableExpression<T>
  | PropertyExpression<T>
  | FunctionExpression<any, T>;

interface PropertyExpression<T = any> {
  type: ExpressionType.Property;
  name: keyof T;
  readonly: boolean;
}

interface ObservableExpression<T = any> {
  type: ExpressionType.Observable;
  observable: Observable<T>;
}

interface FunctionExpression<T = any, U = any> {
  type: ExpressionType.Function;
  func: (data: T) => U;
}

export function isExpression(value: any): value is Expression {
  return (
    value &&
    value['type'] !== null &&
    value['type'] !== undefined &&
    value.type >= ExpressionType.Property &&
    value.type <= ExpressionType.Observable
  );
}
