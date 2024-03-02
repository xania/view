import { Operation, OperationType, next, push } from './operations';
import { TreeNode } from './tree';

const REGISTERS: Record<symbol, number> = {};
export function execute(operations: Operation[], node: TreeNode) {
  const scopeStack: unknown[] = [];
  const nodeStack: unknown[] = [];

  let currentNode = node;
  let currentScope = undefined;

  const length = operations.length;
  for (let i = 0; i < length; i++) {
    const curr = operations[i];

    switch (curr.type) {
      case OperationType.Next:
        const index = 1 + (REGISTERS[curr.index] ?? 0);
        const { values } = curr;
        if (index < values.length) {
          currentScope = values[index];
          REGISTERS[curr.index] = index;
          i -= curr.length;
        }
        break;
      case OperationType.PushScope:
        if (currentScope !== undefined) {
          scopeStack.push(currentScope);
        }
        currentScope = curr.scope;
        break;
      case OperationType.PopScope:
        currentScope = scopeStack.pop();
        break;
      case OperationType.Debug:
        console.debug('current scope: ', currentScope, scopeStack);
        break;
      case OperationType.CreateNode:
        curr.create(currentNode, currentScope);
        break;
      case OperationType.CreateAndPushNode:
        nodeStack.push(currentNode);
        currentNode = curr.create(currentNode, currentScope);
        break;
      case OperationType.Jump:
        i += curr.steps;
        break;
    }
  }
}
