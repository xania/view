import { Stateful } from '../reactive';

export enum HydrateOperationType {
  PushChild = 686859,
  PopChild,
  ApplyEventHandler,
  ApplyStateHandler,
  PushSibling,
}

export type EventOperation =
  | PushChild
  | PopChild
  | PushSibling
  | ApplyEventHandler
  | ApplyStateHandler;

export type HydrateOperation = EventOperation;

export interface PushChild {
  type: HydrateOperationType.PushChild;
  index: number;
}

export interface PopChild {
  type: HydrateOperationType.PopChild;
}

export interface PushSibling {
  type: HydrateOperationType.PushSibling;
  offset: number;
}

export interface ApplyEventHandler {
  type: HydrateOperationType.ApplyEventHandler;
  handler: JSX.EventHandler;
}

export interface ApplyStateHandler {
  type: HydrateOperationType.ApplyStateHandler;
  state: Stateful;
}
