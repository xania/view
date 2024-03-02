import { TreeNode } from './tree';

export enum OperationType {
  PushScope,
  PopScope,
  Jump,
  Debug,
  CreateNode,
  CreateAndPushNode,
  Next,
}

export type Operation<TNode> =
  | PushScopeOperation
  | PopScopeOperation
  | JumpOperation
  | DebugOperation
  | CreateNodeOperation<TNode>
  | NextOperation
  | CreateAndPushNodeOperation<TNode>;

interface DebugOperation {
  type: OperationType.Debug;
}

interface JumpOperation {
  type: OperationType.Jump;
  steps: number;
}
interface PushScopeOperation {
  type: OperationType.PushScope;
  scope: any;
}

interface PopScopeOperation {
  type: OperationType.PopScope;
}

interface CreateNodeOperation<TNode> {
  type: OperationType.CreateNode;
  create(node: TNode, scope: any): TNode;
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

export function push(scope: any): PushScopeOperation {
  return {
    type: OperationType.PushScope,
    scope,
  };
}

function popScope(): PopScopeOperation {
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

export function forEach<TNode>(
  values: any[],
  operations: Operation<TNode>[]
): Operation<TNode>[] | null {
  if (values.length == 0) {
    return null;
  }

  const index: symbol = Symbol();

  return [
    push(values[0]),
    ...operations,
    next(index, values, operations.length + 1),
  ];
}

export function createNode<TNode>(
  nodeFactory: (node: TNode, scope: any) => TNode
): CreateNodeOperation<TNode> {
  return {
    type: OperationType.CreateNode,
    create: nodeFactory,
  };
}
