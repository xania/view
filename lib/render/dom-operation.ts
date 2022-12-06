import { Deferred, Renderable } from '../jsx';

export enum DomOperationType {
  PushFirstChild,
  PushNextSibling,
  PushChild,
  PopNode,
  SetAttribute,
  SetClassName,
  SetClassModule,
  SetTextContent,
  Renderable,
  AppendChild,
  Deferred,
  Clone,
}

export interface DeferredOperation<TContext> {
  type: DomOperationType.Deferred;
  deferred: Deferred<TContext, any>;
  operation: DomOperationType.SetClassName;
  nodeKey: symbol;
  valueKey: symbol;
}

export interface PushFirstChildOperation {
  type: DomOperationType.PushFirstChild;
}
export interface PushNextSiblingOperation {
  type: DomOperationType.PushNextSibling;
  offset: number;
}
export interface PushChildOperation {
  type: DomOperationType.PushChild;
  index: number;
}
export interface PopNodeOperation {
  type: DomOperationType.PopNode;
  index: number;
}
export interface SetAttributeOperation {
  type: DomOperationType.SetAttribute;
  name: string;
  expression: JSX.Expression;
}

export interface SetClassNameOperation {
  key: symbol;
  type: DomOperationType.SetClassName;
  expressions?: JSX.Expression[];
  expression: JSX.Expression<any, any>;
}

export interface SetClassModuleOperation {
  key: symbol;
  type: DomOperationType.SetClassModule;
  expressions?: JSX.Expression[];
  expression: JSX.Expression<any, any>;
  classes?: { [k: string]: string };
}

interface SetExclusiveTextContentOperation {
  key: symbol;
  nodeKey: symbol;
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
  isExclusive: true;
}

export interface SetSharedTextContentOperation {
  key: symbol;
  nodeKey: symbol;
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
  textNodeIndex: number;
  isExclusive: false;
}

export type SetTextContentOperation =
  | SetExclusiveTextContentOperation
  | SetSharedTextContentOperation;

export interface RenderableOperation<T> {
  type: DomOperationType.Renderable;
  renderable: Renderable<T> & { [key: string | number | symbol]: any };
}

export interface AppendChildOperation {
  type: DomOperationType.AppendChild;
  node: Node;
}

// export interface SelectRootOperation {
//   type: DomOperationType.SelectRoot;
//   index: number;
//   dependency: string | number | symbol;
//   key: symbol;
// }

// export interface UpdateRootOperation<TContext, TState, TResult = any> {
//   type: DomOperationType.UpdateRoot;
//   index: number;
//   state: TState;
//   combine: JsxContext<TState, TContext, TResult>['combine'];
//   key: symbol;
// }

export interface CloneOperation {
  type: DomOperationType.Clone;
  templateNode: Node;
}

export type DomNavigationOperation =
  | PushFirstChildOperation
  | PushNextSiblingOperation
  | PushChildOperation
  | PopNodeOperation;

export type DomRenderOperation<T> =
  | SetAttributeOperation
  | SetClassNameOperation
  | SetClassModuleOperation
  | SetTextContentOperation
  | RenderableOperation<T>
  | AppendChildOperation
  | DeferredOperation<T>;

export type DomOperation<T> =
  | DomNavigationOperation
  | DomRenderOperation<T>
  | CloneOperation;

(window as any)['operationName'] = function (op: DomOperation<any>) {
  return DomOperationType[op.type];
};
