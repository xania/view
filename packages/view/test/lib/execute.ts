import { Operation, OperationType } from './operations';
import { ExecutionScope } from '.';

interface ExecuteTreeNode<TNode> {
  appendChild(child: TNode): void;
}

export function execute<TNode extends ExecuteTreeNode<TNode>>(
  operations: Operation<TNode>[],
  rootNode: TNode
) {
  if (!(operations instanceof Array)) return;

  const registers: Record<symbol, number> = {};

  let currentScope: any = new ExecutionScope();
  const scopeStack: any[] = [];
  let currentNode: TNode = rootNode;
  const nodeStack: TNode[] = [];

  return internal(operations, 0);

  function internal(operations: Operation<TNode>[], start: number = 0): any {
    const length = operations.length;
    for (let i = start; i < length; i++) {
      const curr = operations[i];

      if (curr instanceof Promise) {
        return curr.then(internal).then(() => internal(operations, i + 1));
      }

      switch (curr.type) {
        case OperationType.Next:
          const index = 1 + (registers[curr.index] ?? 0);
          const { values } = curr;
          if (index < values.length) {
            currentScope = new ExecutionScope(values[index]);
            registers[curr.index] = index;
            i -= curr.length;
          }
          break;
        case OperationType.PushScope:
          scopeStack.push(currentScope);
          const { context } = curr;
          currentScope =
            context instanceof ExecutionScope
              ? context
              : new ExecutionScope(context);
          break;
        case OperationType.PopScope:
          currentScope = scopeStack.pop();
          break;
        case OperationType.Debug:
          console.debug('current scope: ', currentScope, scopeStack);
          break;
        case OperationType.CreateNode:
          const child = new curr.constructor();
          currentNode.appendChild(child);
          nodeStack.push(currentNode);
          currentNode = child;
          if (curr.set) {
            (child as any)[curr.set] = currentScope.context;
          }
          break;
        case OperationType.CreateAndPushNode:
          nodeStack.push(currentNode);
          currentNode = curr.create(currentNode, currentScope);
          break;
        case OperationType.Jump:
          i += curr.steps;
          break;
        case OperationType.SetProperty:
          (currentNode as any)[curr.name] = curr.value;
          break;
        case OperationType.PopNode:
          currentNode = nodeStack.pop()!;
          break;
        default:
          throw new Error('Unsupported operation', curr);
      }
    }
  }
}
