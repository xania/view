interface BaseNode {
  before(...nodes: ViewNode[]): void;
  remove(): void;
}

export interface TextNode extends BaseNode {
  data: string;
}

export interface CommentNode extends BaseNode {}

export interface ElementNode extends BaseNode {
  namespaceURI: string | null;
  classList: ClassList;

  appendChild(node: ViewNode): ViewNode;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions | undefined
  ): void;
  before(...nodes: ViewNode[]): void;
  setAttribute(str: string, value: any): void;
}

export type ViewNode = TextNode | ElementNode | CommentNode;

export interface NodeFactory<TElement, TNode extends ViewNode> {
  createElement(
    parentElement: TElement | AnchorNode<TNode>,
    name: string
  ): TElement;
  createTextNode(
    parentElement: TElement | AnchorNode<TNode>,
    data: string
  ): TextNode;
  createComment(
    parentElement: TElement | AnchorNode<TNode>,
    data: string
  ): CommentNode;
}

interface ClassList {
  add(...values: string[]): any;
  remove(...values: string[]): any;
}

export class AnchorNode<TNode extends ViewNode> {
  constructor(public anchorNode: TNode) {}

  appendChild(node: TNode) {
    // const { parentElement } = this.anchorNode;
    this.anchorNode.before(node);
    // parentElement!.insertBefore(node, this.anchorNode);
  }
  // addEventListener(
  //   type: string,
  //   listener: EventListenerOrEventListenerObject,
  //   options?: boolean | AddEventListenerOptions | undefined
  // ): void {
  //   return this.container.addEventListener(type, listener, options);
  // }

  static create<TNode extends ViewNode>(
    anchorNode?: ViewNode | AnchorNode<TNode> | undefined
  ) {
    if (!anchorNode) {
      return undefined;
    }

    if (anchorNode instanceof AnchorNode) {
      return new AnchorNode(anchorNode.anchorNode);
    } else {
      return new AnchorNode(anchorNode);
    }
  }
}
