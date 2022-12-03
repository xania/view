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
  key: symbol;
  type: DomOperationType.PushFirstChild;
}
export interface PushNextSiblingOperation {
  key: symbol;
  type: DomOperationType.PushNextSibling;
}
export interface PushChildOperation {
  key: symbol;
  type: DomOperationType.PushChild;
  index: number;
}
export interface PopNodeOperation {
  key: symbol;
  type: DomOperationType.PopNode;
}
export interface SetAttributeOperation {
  key: symbol;
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
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
  textNodeIndex?: number;
}

export interface RenderableOperation<T> {
  key: symbol;
  type: DomOperationType.Renderable;
  renderable: Renderable<T> & { [key: string | number | symbol]: any };
}

export interface AddEventListenerOperation {
  key: symbol;
  type: DomOperationType.AddEventListener;
  name: string;
  handler: Function;
}

export interface AppendChildOperation {
  key: symbol;
  type: DomOperationType.AppendChild;
  node: Node;
}

export interface SelectNodeOperation {
  key: symbol;
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
