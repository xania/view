import { Expression } from './expression';
import { Renderable } from './template';

export enum DomOperationType {
  PushFirstChild,
  PushNextSibling,
  PushChild,
  PopNode,
  SetAttribute,
  SetTextContent,
  Renderable,
  AddEventListener,
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
  expression: Expression;
}
export interface SetTextContentOperation {
  type: DomOperationType.SetTextContent;
  expression: Expression;
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

export type DomOperation =
  | PushFirstChildOperation
  | PushNextSiblingOperation
  | PushChildOperation
  | PopNodeOperation
  | SetAttributeOperation
  | SetTextContentOperation
  | RenderableOperation
  | AddEventListenerOperation;
