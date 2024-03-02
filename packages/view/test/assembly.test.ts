import { describe, expect, it } from 'vitest';
import {
  Operation,
  OperationType,
  createNode,
  forEach,
  next,
  push,
} from './operations';
import { execute } from './execute';
import { TreeNode, NodeType, TextNode, ElementNode } from './tree';

describe('reactive control operations', () => {
  it('iterates', () => {
    const operations = forEach(
      ['ibrahim', 'ben Salah'],
      [createNode(testNodeFactory)]
    );
    const root = new ElementNode();
    if (operations != null) {
      execute(operations, root);
    }
    console.log(root);
  });
});

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

function testNodeFactory(node: TreeNode, scope: any) {
  const textNode = new TextNode();
  textNode.textContent = scope;
  node.children?.push(textNode);
  return textNode;
}
