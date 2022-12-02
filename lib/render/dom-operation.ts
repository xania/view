import { Renderable } from '../jsx';

export enum DomOperationType {
  PushFirstChild,
  PushNextSibling,
  PushChild,
  PopNode,
  SetAttribute,
  SetClassName,
  SetTextContent,
  Renderable,
  AddEventListener,
  AppendChild,
  SelectNode,
}

export interface PushFirstChildOperation {
  type: DomOperationType.PushFirstChild;
}
export interface PushNextSiblingOperation {
  type: DomOperationType.PushNextSibling;
}
export interface PushChildOperation {
  type: DomOperationType.PushChild;
  index: number;
}
export interface PopNodeOperation {
  type: DomOperationType.PopNode;
}
export interface SetAttributeOperation {
  type: DomOperationType.SetAttribute;
  name: string;
  expression: JSX.Expression;
}

export interface SetClassNameOperation {
  type: DomOperationType.SetClassName;
  expressions?: JSX.Expression[];
  expression: JSX.Expression<any, any>;
  classes?: { [k: string]: string };
}
export interface SetTextContentOperation {
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
  textNodeIndex?: number;
}

export interface RenderableOperation<T> {
  type: DomOperationType.Renderable;
  renderable: Renderable<T> & { [key: string | number | symbol]: any };
}

export interface AddEventListenerOperation {
  type: DomOperationType.AddEventListener;
  name: string;
  handler: Function;
}

export interface AppendChildOperation {
  type: DomOperationType.AppendChild;
  node: Node;
}

export interface SelectNodeOperation {
  type: DomOperationType.SelectNode;
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
  | SelectNodeOperation;

export type DomEventOperation = AddEventListenerOperation;

export type DomOperation<T> =
  | DomNavigationOperation
  | AddEventListenerOperation
  | DomRenderOperation<T>;
