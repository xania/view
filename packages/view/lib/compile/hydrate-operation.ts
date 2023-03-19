export enum HydrateOperationType {
  PushChild = 686859,
  PopChild,
  ApplyEventHandler,
  ApplySignalHandler,
  PushSibling,
}

export type EventOperation =
  | PushChild
  | PopChild
  | PushSibling
  | ApplyEventHandler
  | ApplySignalHandler;

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

export interface ApplySignalHandler {
  type: HydrateOperationType.ApplySignalHandler;
  state: number;
}
