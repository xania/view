import { State } from './state';

export enum ExpressionType {
  Property,
  Function,
  State,
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

export interface StateExpression {
  type: ExpressionType.State;
  state: State<any>;
}

export type Expression =
  | PropertyExpression
  | FunctionExpression
  | StateExpression;
