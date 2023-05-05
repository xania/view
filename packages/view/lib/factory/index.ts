import { EventManager } from "../reactivity/event-manager";

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

export interface NodeFactory<TElement, TNode extends ViewNode> extends EventManager<TElement> {
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

export class AnchorNode<TNode> {
  constructor(public anchorNode: TNode) {}

  static create<TNode>(anchorNode?: TNode | AnchorNode<TNode> | undefined) {
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
