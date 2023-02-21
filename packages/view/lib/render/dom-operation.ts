import { Attachable, Lazy, Renderable } from '../jsx';
import { Expression } from '../jsx/expression';
import { Observable } from '../jsx/observables';

export enum DomOperationType {
  PushFirstChild = 693571,
  PushNextSibling,
  PushChild,
  PopNode,
  SetAttribute,
  SetClassName,
  SetTextContent,
  Renderable,
  Attachable,
  Subscribable,
  AppendChild,
  Lazy,
  Clone,
  AppendText,
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
  nodeKey: symbol;
  type: DomOperationType.SetAttribute;
  name: string;
  expression: Expression;
}

export interface SetClassNameOperation {
  nodeKey: symbol;
  prevKey: symbol;
  type: DomOperationType.SetClassName;
  expressions?: Expression[];
  expression: Expression;
  classes?: { [k: string]: string };
}

export interface SetTextContentOperation {
  key: symbol;
  nodeKey: symbol;
  type: DomOperationType.SetTextContent;
  expression: Expression;
}

export interface DomRenderableOperation<T> {
  type: DomOperationType.Renderable;
  renderable: Renderable<T> & { [key: string | number | symbol]: any };
}

export interface DomAttachableOperation {
  type: DomOperationType.Attachable;
  attachable: Attachable;
}

export interface AppendChildOperation {
  type: DomOperationType.AppendChild;
  node: Node;
}

export interface ObservableOperation<T> {
  type: DomOperationType.Subscribable;
  observable: Observable<T>;
  // anchorIdx: number;
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
  clone(): HTMLElement;
}

export interface AppendTextOperation {
  type: DomOperationType.AppendText;
  value: string;
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
  | DomRenderableOperation<T>
  | AppendChildOperation
  | LazyOperation<T>
  | ObservableOperation<T>
  | AppendTextOperation;

export type DomOperation<T> =
  | DomNavigationOperation
  | DomRenderOperation<T>
  | DomAttachableOperation
  | CloneOperation;
