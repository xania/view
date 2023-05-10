import { ElementNode, NodeFactory, TextNode, ViewNode } from '../lib/factory';

class TestClassList {
  public list = new Set<string>();
  add(value: string) {
    this.list.add(value);
  }
  remove(remove: string) {
    this.list.delete(remove);
  }
}

export class TestElementNode implements ElementNode {
  public classList = new TestClassList();
  public childNodes: ViewNode[] = [];

  constructor(
    public namespaceURI: string | null,
    public name: string,
    public parentElement?: TestElementNode | undefined
  ) {}

  appendChild(node: ViewNode): ViewNode {
    this.childNodes.push(node);
    return node;
  }
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions | undefined
  ): void {
    throw new Error('Method not implemented.');
  }
  before(...nodes: ViewNode[]): void {
    throw new Error('Method not implemented.');
  }
  setAttribute(str: string, value: any): void {
    throw new Error('Method not implemented.');
  }
  remove(): void {
    throw new Error('Method not implemented.');
  }
}

export class FactoryStub implements NodeFactory<any, any> {
  createElement(parentElement: any, name: string) {
    throw new Error('Method not implemented.');
  }
  createElementNS(namespaceUri: string, name: string): ElementNode {
    return new TestElementNode(namespaceUri, name);
  }
  createTextNode(data: string): TextNodeStub {
    return new TextNodeStub(data);
  }
  createComment(data: string): CommentNodeStub {
    return new CommentNodeStub(data);
  }
}

class TextNodeStub implements TextNode {
  constructor(public data: string) {}

  before(...nodes: ViewNode[]): void {
    throw new Error('Method not implemented.');
  }
  remove(): void {
    throw new Error('Method not implemented.');
  }
}

class CommentNodeStub implements TextNode {
  constructor(public data: string) {}

  before(...nodes: ViewNode[]): void {
    throw new Error('Method not implemented.');
  }
  remove(): void {
    throw new Error('Method not implemented.');
  }
}
