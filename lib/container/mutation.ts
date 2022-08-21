import { RXJS } from '../../types/rxjs';

export type ContainerMutation<T = unknown> =
  | PushItem<T>
  | RenderItems<T>
  | MoveItem
  | RemoveItemAt
  | InsertItem<T>
  | ResetItems<T>
  | ClearItems
  | SwapItems;

export enum ContainerMutationType {
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
  type: ContainerMutationType.PUSH;
  values: T;
}

interface RenderItems<T> {
  type: ContainerMutationType.RENDER;
  data: ArrayLike<T>;
}
interface MoveItem {
  type: ContainerMutationType.MOVE;
  from: number;
  to: number;
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

export class ViewMutationManager<T> {
  private mutationObservers: RXJS.NextObserver<ContainerMutation<T>>[] = [];

  pushMutation = (mut: ContainerMutation<T>) => {
    if (!mut) return;
    const { mutationObservers } = this;
    let { length } = mutationObservers;
    while (length--) {
      const observer = mutationObservers[length];
      observer.next(mut);
    }
  };

  dispose() {
    throw new Error('Method not implemented.');
  }

  subscribe = (
    observer: RXJS.NextObserver<ContainerMutation<T>>
  ): RXJS.Unsubscribable => {
    if (!(observer?.next instanceof Function)) {
      return EMPTY;
    }

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

const EMPTY: RXJS.Unsubscribable = {
  unsubscribe() {},
};
