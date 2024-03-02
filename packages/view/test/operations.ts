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

export type Operation =
  | PushScopeOperation
  | PopScopeOperation
  | JumpOperation
  | DebugOperation
  | CreateNodeOperation
  | NextOperation
  | CreateAndPushNodeOperation;

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

interface CreateNodeOperation {
  type: OperationType.CreateNode;
  create(node: TreeNode, scope: any): TreeNode;
}

interface CreateAndPushNodeOperation {
  type: OperationType.CreateAndPushNode;
  create(node: TreeNode, scope: any): TreeNode;
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
