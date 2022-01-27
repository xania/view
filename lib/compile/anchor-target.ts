import { RenderTarget } from '../renderable/render-target';

export class AnchorTarget implements RenderTarget {
  constructor(private anchor: Node) {}

  appendChild(node: Node): void {
    const { anchor } = this;
    const parentElement = anchor.parentElement;
    if (parentElement) parentElement.appendChild(node);
  }
  insertBefore<T extends Node>(node: T, child: Node | null) {
    const { anchor } = this;
    const parentElement = anchor.parentElement;
    if (parentElement) parentElement.insertBefore(node, child);
    return node;
  }
  addEventListener(type: string, handler: (evt: Event) => void): void {
    const { anchor } = this;
    const parentElement = anchor.parentElement;
    if (parentElement) parentElement.addEventListener(type, handler);
  }
}
