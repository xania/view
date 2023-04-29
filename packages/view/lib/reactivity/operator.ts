import { State } from './state';

export enum OperatorType {
  // effects
  Effect,
  Assign,
  Append,

  // mappers
  Connect,
  Compute,
  Property,
}

export interface EffectOperator<TObject, T> {
  type: OperatorType.Effect;
  object?: TObject;
  effect: <R>(this: TObject, value: T, acc?: R) => R;
}

export interface PropertyOperator<T = any, P extends keyof T = any> {
  type: OperatorType.Property;
  property: P;
  target: State<T>;
}

export interface AssignOperator<O, P extends keyof O> {
  type: OperatorType.Assign;
  target: O;
  property: P;
}

export interface AppendOperator<T = any> {
  type: OperatorType.Append;
  list: { add(...values: T[]): any; remove(...values: T[]): any };
}

export interface ComputeOperator<T = any, U = any> {
  type: OperatorType.Compute;
  compute(value: T, previous?: U): U;
  target: State<U>;
}

export type Operator =
  | AssignOperator<any, any>
  | AppendOperator
  | ComputeOperator
  | PropertyOperator
  | EffectOperator<any, any>;
