import { AttachTemplate } from '../jsx';
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
  AttachTo,
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
  expressions: JSX.Expression[];
  statics: string[];
}
export interface SetTextContentOperation {
  type: DomOperationType.SetTextContent;
  expression: JSX.Expression;
}

export interface RenderableOperation {
  type: DomOperationType.Renderable;
  renderable: Renderable;
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

export interface AttachToNodeOperation {
  type: DomOperationType.AttachTo;
  attachable: AttachTemplate['attachable'];
}

export type DomNavigationOperation =
  | PushFirstChildOperation
  | PushNextSiblingOperation
  | PushChildOperation
  | PopNodeOperation;

export type DomRenderOperation =
  | SetAttributeOperation
  | SetClassNameOperation
  | SetTextContentOperation
  | RenderableOperation
  | AppendChildOperation
  | SelectNodeOperation
  | AttachToNodeOperation;

export type DomEventOperation = AddEventListenerOperation;

export type DomOperation =
  | DomNavigationOperation
  | DomEventOperation
  | DomRenderOperation;
