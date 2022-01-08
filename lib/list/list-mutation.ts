import { NextObserver, Unsubscribable } from 'lib/abstractions/rxjs';

export type ListMutation<T = unknown> =
  | PushItem<T>
  | PushItems<T>
  | MoveItem
  | RemoveItem<T>
  | RemoveItemAt
  | InsertItem<T>
  | ResetItems<T>
  | ClearItems
  | SwapItems;

export enum ListMutationType {
  PUSH,
  MOVE,
  REMOVE,
  REMOVE_AT,
  INSERT,
  RESET,
  CLEAR,
  PUSH_MANY,
  SWAP,
}

interface PushItem<T> {
  type: ListMutationType.PUSH;
  values: T;
}

interface PushItems<T> {
  type: ListMutationType.PUSH_MANY;
  items: ArrayLike<T>;
  start: number;
  count: number;
}
interface MoveItem {
  type: ListMutationType.MOVE;
  from: number;
  to: number;
}

interface RemoveItem<T> {
  type: ListMutationType.REMOVE;
  item: T;
}

interface RemoveItemAt {
  type: ListMutationType.REMOVE_AT;
  index: number;
}

interface InsertItem<T> {
  type: ListMutationType.INSERT;
  values: T;
  index: number;
}

interface ResetItems<T> {
  type: ListMutationType.RESET;
  items: T[];
}

interface ClearItems {
  type: ListMutationType.CLEAR;
}

interface SwapItems {
  type: ListMutationType.SWAP;
  index1: number;
  index2: number;
}

export function pushItem<T>(values: T): PushItem<T> {
  return {
    type: ListMutationType.PUSH,
    values,
  };
}
export function insertItem<T>(values: T, index: number): InsertItem<T> {
  return {
    type: ListMutationType.INSERT,
    values,
    index,
  };
}

export function removeItem<T>(item: T): RemoveItem<T> {
  return {
    type: ListMutationType.REMOVE,
    item,
  };
}

export function removeItemAt(index: number): RemoveItemAt {
  return {
    type: ListMutationType.REMOVE_AT,
    index,
  };
}

export function resetItems<T>(items: T[]): ResetItems<T> {
  return {
    type: ListMutationType.RESET,
    items,
  };
}

type Prop<T, K extends keyof T> = T[K];

export function isMutation<T = unknown>(mut: any): mut is ListMutation<T> {
  if (!mut) {
    return false;
  }
  const type: Prop<ListMutation, 'type'> = mut.type;
  debugger;
  return type in ListMutationType;
}

export class ListMutationManager<T> {
  private mutationObservers: NextObserver<ListMutation<T>>[] = [];

  pushMutation = (mut: ListMutation<T>) => {
    if (!mut) return;
    const { mutationObservers } = this;
    let { length } = mutationObservers;
    while (length--) {
      const observer = mutationObservers[length];
      observer.next(mut);
    }
  };

  subscribe = (observer: NextObserver<ListMutation<T>>): Unsubscribable => {
    if (!observer) {
      return EMPTY;
    }
    if (typeof observer.next !== 'function') return EMPTY;

    const { mutationObservers } = this;
    mutationObservers.push(observer);
    return {
      unsubscribe() {
        const idx = mutationObservers.indexOf(observer);
        if (idx >= 0) {
          mutationObservers.splice(idx, 1);
        }
      },
    };
  };
}

const EMPTY: Unsubscribable = {
  unsubscribe() {},
};
