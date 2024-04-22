import { Reactive } from '../../reactivity';
import { Operation, OperationType, currentScope } from './operations';
import { TextNode, TreeNode } from '../tree';

export function compile(root: any): Operation<TreeNode>[] {
  const operations: Operation<TreeNode>[] = [];

  iter(root);

  return operations;

  function iter(view: any) {
    if (view instanceof Array) {
      for (const item of view) {
        iter(item);
      }
    } else if (view instanceof Promise) {
      operations.push(view.then(compile));
    } else if (currentScope === view) {
      operations.push(
        {
          type: OperationType.CreateNode,
          constructor: TextNode,
          set: 'textContent',
        },
        {
          type: OperationType.PopNode,
        }
      );
    } else if (view instanceof Reactive) {
      operations.push(
        {
          type: OperationType.CreateNode,
          constructor: TextNode,
        },
        {
          type: OperationType.PushScope,
          context: 1234,
        },
        {
          type: OperationType.SetProperty,
          name: 'textContent',
          value: view.initial,
        },
        {
          type: OperationType.PopNode,
        }
      );
    } else {
      operations.push(
        {
          type: OperationType.CreateNode,
          constructor: TextNode,
        },
        {
          type: OperationType.SetProperty,
          name: 'textContent',
          value: view,
        },
        {
          type: OperationType.PopNode,
        }
      );
    }
  }
}

export function createNode() {}
