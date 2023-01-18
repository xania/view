import { Observable } from './observables';
import { TemplateInput } from './template-input';

export enum ExpressionType {
  Property = 353461,
  Function,
  Observable,
  Bind,
}

export type Expression<T = any> =
  | ObservableExpression<T>
  | PropertyExpression<T>
  | FunctionExpression<any, T>
  | BindExpression<T>;

interface PropertyExpression<T = any> {
  type: ExpressionType.Property;
  name: keyof T;
  readonly: boolean;
}

interface BindExpression<T = any> {
  type: ExpressionType.Bind;
  binder: (value: T) => TemplateInput<T>;
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
