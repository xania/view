import { Signal } from '../../reactivity';
import { TextNode } from '../tree';

export enum OperationType {
  PushScope,
  PopScope,
  Jump,
  Debug,
  CreateNode,
  CreateAndPushNode,
  Next,
  SetProperty,
  PopNode,
}

export type Operation<TNode> =
  | PushScopeOperation
  | PopScopeOperation
  | JumpOperation
  | DebugOperation
  | CreateNodeOperation<TNode>
  | NextOperation
  | CreateAndPushNodeOperation<TNode>
  | Promise<Operation<TNode>[]>
  | SetPropertyOperator
  | PopNodeOperation;

interface PopNodeOperation {
  type: OperationType.PopNode;
}

interface SetPropertyOperator {
  type: OperationType.SetProperty;
  name: string | symbol | number;
  value: string;
}

interface DebugOperation {
  type: OperationType.Debug;
}

interface JumpOperation {
  type: OperationType.Jump;
  steps: number;
}
interface PushScopeOperation {
  type: OperationType.PushScope;
  context: any;
}

interface PopScopeOperation {
  type: OperationType.PopScope;
}

interface CreateNodeOperation<TNode> {
  type: OperationType.CreateNode;
  constructor: TNodeConstructor<TNode>;
  set?: string;
}

interface TNodeConstructor<TNode> {
  new (): TNode;
}

interface CreateAndPushNodeOperation<TNode> {
  type: OperationType.CreateAndPushNode;
  create(node: TNode, scope: any): TNode;
}

interface NextOperation {
  type: OperationType.Next;
  values: any[];
  index: symbol;
  length: number;
}

export function pushScope(context: any): PushScopeOperation {
  return {
    type: OperationType.PushScope,
    context,
  };
}

export function popScope(): PopScopeOperation {
  return {
    type: OperationType.PopScope,
  };
}

function jump(steps: number): JumpOperation {
  return {
    type: OperationType.Jump,
    steps,
  };
}

export function next(
  index: symbol,
  values: any[],
  length: number
): NextOperation {
  return {
    type: OperationType.Next,
    index,
    values,
    length,
  };
}

export class Scoped<T> extends Signal<T> {}

export function forEach<T>(values: T[]) {
  if (values.length == 0) {
    return {
      map(): null {
        return null;
      },
    };
  }

  const key: symbol = Symbol();
  const listItem = new Scoped<T>(undefined, key);

  return {
    map<TNode>(
      f: (scope: typeof currentScope) => Operation<TNode>[]
    ): Operation<TNode>[] {
      const operations = f(currentScope);
      return [
        pushScope(values[0]),
        ...operations,
        next(key, values, operations.length + 1),
      ];
    },
  };
}

export const currentScope: Signal = new Signal();
