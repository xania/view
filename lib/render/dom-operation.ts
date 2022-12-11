import { Lazy, Renderable, RenderTarget } from '../jsx';

export enum DomOperationType {
  PushFirstChild,
  PushNextSibling,
  PushChild,
  PopNode,
  SetAttribute,
  SetClassName,
  SetTextContent,
  Renderable,
  Subscribable,
  AppendChild,
  Lazy,
  Clone,
}

export interface LazyOperation<TContext> {
  type: DomOperationType.Lazy;
  lazy: Lazy<TContext, any>;
  operation: SetClassNameOperation | SetAttributeOperation;
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
  classes?: { [k: string]: string };
}

export interface SetTextContentOperation {
  key: symbol;
  nodeKey: symbol;
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
}

export interface RenderableOperation<T> {
  type: DomOperationType.Renderable;
  renderable: Renderable<T> & { [key: string | number | symbol]: any };
  anchorIdx: number;
}

export interface AppendChildOperation {
  type: DomOperationType.AppendChild;
  node: Node;
}

export interface SubscribableOperation<T> {
  type: DomOperationType.Subscribable;
  subscribable: JSX.Subscribable<T>;
  anchorIdx: number;
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
  target: RenderTarget;
}

export type DomNavigationOperation =
  | PushFirstChildOperation
  | PushNextSiblingOperation
  | PushChildOperation
  | PopNodeOperation;

export type DomRenderOperation<T> =
  | SetAttributeOperation
  | SetClassNameOperation
  | SetTextContentOperation
  | RenderableOperation<T>
  | AppendChildOperation
  | LazyOperation<T>
  | SubscribableOperation<T>;

export type DomOperation<T> =
  | DomNavigationOperation
  | DomRenderOperation<T>
  | CloneOperation;

(window as any)['operationName'] = function (op: DomOperation<any>) {
  return DomOperationType[op.type];
};
