import { describe, expect, it } from 'vitest';
import { Operation, OperationType, next, push } from './operations';
import { execute } from './execute';
import { TreeNode, NodeType, TextNode, ElementNode } from './tree';

describe('reactive assembly', () => {
  // it('literal', () => {
  //   const name = 'Ibrahim';
  //   var operations = compile(name);

  //   const root = new Node(NodeType.Element);
  //   execute(operations, root);
  //   expect(root.children).toHaveLength(1);
  //   expect(root.children[0].textContent).toBe(name);
  // });

  it('iterates', () => {
    const operations = forEach(
      ['ibrahim', 'ben Salah'],
      [
        {
          type: OperationType.CreateNode,
          create(node, scope) {
            console.log(' -', scope);
            const textNode = new TextNode();
            textNode.textContent = scope;
            node.children?.push(textNode);
            return textNode;
          },
        },
      ]
    );
    const root = new ElementNode();
    if (operations != null) {
      execute(operations, root);
    }
    console.log(root);
  });
});

function forEach(values: any[], operations: Operation[]): Operation[] | null {
  if (values.length == 0) {
    return null;
  }

  const index: symbol = Symbol();

  return [
    push(values[0]),
    ...operations,
    next(index, values, operations.length + 1),
  ];
}

// function compile(item: any): Operation[] {
//   return [
//     {
//       type: OperationType.AppendChild,
//       appendChild(node: TreeNode): TreeNode {
//         const child = new TreeNode(NodeType.Text);
//         child.textContent = item;
//         node.appendChild(child);
//         return child;
//       },
//     },
//   ];
// }
