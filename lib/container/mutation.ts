import { NextObserver, Unsubscribable } from '../abstractions/rxjs';

export type ContainerMutation<T = unknown> =
  | PushItem<T>
  | PushItems<T>
  | MoveItem
  | RemoveItem<T>
  | RemoveItemAt
  | InsertItem<T>
  | ResetItems<T>
  | ClearItems
  | SwapItems
  | UpdateItem<T>;

export enum ContainerMutationType {
  PUSH,
  MOVE,
  REMOVE,
  REMOVE_AT,
  INSERT,
  RESET,
  CLEAR,
  PUSH_MANY,
  SWAP,
  UPDATE,
}

interface PushItem<T> {
  type: ContainerMutationType.PUSH;
  values: T;
}

interface PushItems<T> {
  type: ContainerMutationType.PUSH_MANY;
  items: ArrayLike<T>;
}
interface MoveItem {
  type: ContainerMutationType.MOVE;
  from: number;
  to: number;
}

interface RemoveItem<T> {
  type: ContainerMutationType.REMOVE;
  item: T;
}

interface RemoveItemAt {
  type: ContainerMutationType.REMOVE_AT;
  index: number;
}

interface InsertItem<T> {
  type: ContainerMutationType.INSERT;
  values: T;
  index: number;
}

interface ResetItems<T> {
  type: ContainerMutationType.RESET;
  items: T[];
}

interface ClearItems {
  type: ContainerMutationType.CLEAR;
}

interface SwapItems {
  type: ContainerMutationType.SWAP;
  index1: number;
  index2: number;
}

interface UpdateItem<T> {
  type: ContainerMutationType.UPDATE;
  index: number;
  values: T;
}

export function pushItem<T>(values: T): PushItem<T> {
  return {
    type: ContainerMutationType.PUSH,
    values,
  };
}
export function insertItem<T>(values: T, index: number): InsertItem<T> {
  return {
    type: ContainerMutationType.INSERT,
    values,
    index,
  };
}

export function removeItem<T>(item: T): RemoveItem<T> {
  return {
    type: ContainerMutationType.REMOVE,
    item,
  };
}

export function removeItemAt(index: number): RemoveItemAt {
  return {
    type: ContainerMutationType.REMOVE_AT,
    index,
  };
}

export function resetItems<T>(items: T[]): ResetItems<T> {
  return {
    type: ContainerMutationType.RESET,
    items,
  };
}

type Prop<T, K extends keyof T> = T[K];

export function isMutation<T = unknown>(mut: any): mut is ContainerMutation<T> {
  if (!mut) {
    return false;
  }
  const type: Prop<ContainerMutation, 'type'> = mut.type;
  debugger;
  return type in ContainerMutationType;
}

export class ContainerMutationManager<T> {
  private mutationObservers: NextObserver<ContainerMutation<T>>[] = [];

  pushMutation = (mut: ContainerMutation<T>) => {
    if (!mut) return;
    const { mutationObservers } = this;
    let { length } = mutationObservers;
    while (length--) {
      const observer = mutationObservers[length];
      observer.next(mut);
    }
  };

  subscribe = (
    observer: NextObserver<ContainerMutation<T>>
  ): Unsubscribable => {
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
