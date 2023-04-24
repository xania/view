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

export interface NodeFactory {
  createElementNS(namespaceUri: string, name: string): ElementNode;
  createTextNode(data: string): TextNode;
  createComment(data: string): CommentNode;
}

interface ClassList {
  add(...values: string[]): any;
  remove(...values: string[]): any;
}

export class AnchorNode {
  constructor(public container: ElementNode, public anchorNode: ViewNode) {}

  appendChild(node: ViewNode) {
    // const { parentElement } = this.anchorNode;
    this.anchorNode.before(node);
    // parentElement!.insertBefore(node, this.anchorNode);
  }
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    return this.container.addEventListener(type, listener, options);
  }

  static create(
    container: ElementNode,
    anchorNode?: ViewNode | AnchorNode | undefined
  ) {
    if (!anchorNode) {
      return undefined;
    }

    if (anchorNode instanceof AnchorNode) {
      return new AnchorNode(container, anchorNode.anchorNode);
    } else {
      return new AnchorNode(container, anchorNode);
    }
  }
}
