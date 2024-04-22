export enum NodeType {
  Element,
  Text,
}

export type TreeNode = ElementNode | TextNode;

export class ElementNode {
  [prop: string]: any;
  children: TreeNode[] = [];

  appendChild(node: TreeNode) {
    this.children?.push(node);
  }
}

export class TextNode {
  textContent: string = '';
  appendChild() {
    throw 'Not Supported!';
  }
}
