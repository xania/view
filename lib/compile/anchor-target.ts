import { RenderTarget } from '../renderable/render-target';

export class AnchorTarget implements RenderTarget {
  parentElement: HTMLElement | null;

  constructor(private anchor: Node) {
    this.parentElement = anchor.parentElement;
  }

  removeChild(node: Node): void {
    const { parentElement } = this;
    if (parentElement) parentElement.removeChild(node);
  }

  appendChild(child: Node): void {
    const { parentElement, anchor } = this;
    if (parentElement) parentElement.insertBefore(child, anchor);
  }
  insertBefore<T extends Node>(node: T, child: Node | null) {
    const { parentElement } = this;
    if (parentElement) parentElement.insertBefore(node, child);
    return node;
  }
  addEventListener(type: string, handler: (evt: Event) => void): void {
    const { parentElement } = this;
    if (parentElement) parentElement.addEventListener(type, handler);
  }

  childNodes: ArrayLike<Node> = [];

  contains() {
    return false;
  }
}
