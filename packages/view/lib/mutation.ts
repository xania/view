export type ViewMutation<T = unknown> =
  | PushItem<T>
  | RenderItems<T>
  | MoveItem
  | RemoveItemAt
  | InsertItem<T>
  | ResetItems<T>
  | ClearItems
  | SwapItems;

export enum ViewMutationType {
  PUSH,
  MOVE,
  REMOVE_AT,
  INSERT,
  RESET,
  CLEAR,
  RENDER,
  SWAP,
}

interface PushItem<T> {
  type: ViewMutationType.PUSH;
  values: T;
}

interface RenderItems<T> {
  type: ViewMutationType.RENDER;
  data: ArrayLike<T>;
}
interface MoveItem {
  type: ViewMutationType.MOVE;
  from: number;
  to: number;
}

interface RemoveItemAt {
  type: ViewMutationType.REMOVE_AT;
  index: number;
}

interface InsertItem<T> {
  type: ViewMutationType.INSERT;
  values: T;
  index: number;
}

interface ResetItems<T> {
  type: ViewMutationType.RESET;
  items: T[];
}

interface ClearItems {
  type: ViewMutationType.CLEAR;
}

interface SwapItems {
  type: ViewMutationType.SWAP;
  index1: number;
  index2: number;
}

export function pushItem<T>(values: T): PushItem<T> {
  return {
    type: ViewMutationType.PUSH,
    values,
  };
}
export function insertItem<T>(values: T, index: number): InsertItem<T> {
  return {
    type: ViewMutationType.INSERT,
    values,
    index,
  };
}

export function removeItemAt(index: number): RemoveItemAt {
  return {
    type: ViewMutationType.REMOVE_AT,
    index,
  };
}

export function resetItems<T>(items: T[]): ResetItems<T> {
  return {
    type: ViewMutationType.RESET,
    items,
  };
}

type Prop<T, K extends keyof T> = T[K];

export function isMutation<T = unknown>(mut: any): mut is ViewMutation<T> {
  if (!mut) {
    return false;
  }
  const type: Prop<ViewMutation, 'type'> = mut.type;
  debugger;
  return type in ViewMutationType;
}
