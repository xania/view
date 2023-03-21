import { Scope } from '../reactive';
import { EventOperation, HydrateOperationType } from './hydrate-operation';

export function applyEventOperations(
  operations: EventOperation[],
  rootTarget: HTMLElement,
  rootIdx: number,
  resolve?: (currentTarget: HTMLElement, handler: JSX.EventHandler) => boolean
) {
  let currentIndex = 0;
  let currentDepth = 0;
  let operationIndex = 0;
  for (
    let opLen = operations.length;
    operationIndex < opLen;
    operationIndex++
  ) {
    if (currentIndex === rootIdx) {
      break;
    } else if (currentIndex > rootIdx) {
      return;
    }

    const operation = operations[operationIndex];
    if (operation.type === HydrateOperationType.PushChild) {
      currentDepth++;
    } else if (operation.type === HydrateOperationType.PopChild) {
      currentDepth--;
    } else if (operation.type === HydrateOperationType.PushSibling) {
      if (currentDepth === 0) {
        currentIndex += operation.offset;
      }
    }
  }

  const stack: Node[] = [];
  let currentTarget: Node = rootTarget;
  for (
    let opLen = operations.length;
    operationIndex < opLen;
    operationIndex++
  ) {
    const operation = operations[operationIndex];
    if (operation.type === HydrateOperationType.PushChild) {
      stack.push(currentTarget);
      currentTarget = currentTarget.childNodes[operation.index];
    } else if (operation.type === HydrateOperationType.PopChild) {
      currentTarget = stack.pop()!;
      if (stack.length === 0) {
        break;
      }
    } else if (operation.type === HydrateOperationType.PushSibling) {
      for (let i = 0, len = operation.offset; i < len; i++) {
        currentTarget = currentTarget.nextSibling!;
      }
    } else if (operation.type === HydrateOperationType.ApplyEventHandler) {
      if (resolve && resolve(currentTarget as HTMLElement, operation.handler)) {
        return;
      }
    }
  }
}

export function applySignalOperations(
  operations: EventOperation[],
  rootTarget: HTMLElement,
  scope: Scope
) {
  const stack: Node[] = [];
  let currentTarget: Node = rootTarget;
  for (
    let operationIndex = 0, opLen = operations.length;
    operationIndex < opLen;
    operationIndex++
  ) {
    const operation = operations[operationIndex];
    if (operation.type === HydrateOperationType.PushChild) {
      stack.push(currentTarget);
      currentTarget = currentTarget.childNodes[operation.index];
    } else if (operation.type === HydrateOperationType.PopChild) {
      currentTarget = stack.pop()!;
      if (stack.length === 0) {
        break;
      }
    } else if (operation.type === HydrateOperationType.PushSibling) {
      for (let i = 0, len = operation.offset; i < len; i++) {
        currentTarget = currentTarget.nextSibling!;
      }
    } else if (operation.type === HydrateOperationType.ApplyStateHandler) {
      const { state } = operation;
      currentTarget.textContent = scope.get(state);
    }
  }
}
