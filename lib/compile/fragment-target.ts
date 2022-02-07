import { RenderTarget } from '../renderable/render-target';
import { valuesKey } from './helpers';

export class FragmentTarget implements RenderTarget {
  constructor(
    private parentElement: RenderTarget,
    public childNodes: ArrayLike<Node>,
    public values: any
  ) {
    this[valuesKey] = values;
  }

  [valuesKey]: any;

  get firstChild() {
    return this.childNodes[0];
  }

  get lastChild() {
    const { childNodes } = this;
    const lastIndex = childNodes.length - 1;
    return this.childNodes[lastIndex];
  }

  get nextSibling() {
    const { childNodes } = this;
    const lastIndex = childNodes.length - 1;
    return this.childNodes[lastIndex].nextSibling;
  }
  remove() {
    const { childNodes } = this;
    for (let i = 0, len = childNodes.length; i < len; i++)
      this.parentElement.removeChild(childNodes[i]);
  }
  removeChild(node: Node): void {
    this.parentElement.removeChild(node);
  }
  appendChild(node: Node): void {
    this.parentElement.appendChild(node);
  }
  addEventListener(type: string, handler: (evt: Event) => void): void {
    this.parentElement.addEventListener(type, handler);
  }
  insertBefore<T extends Node>(node: T, child: Node | null): T {
    return this.parentElement.insertBefore(node, child);
  }

  // contains(node: Node | null) {
  //   if (!node) return false;
  //   const { childNodes } = this;
  //   for (let i = 0, len = childNodes.length; i < len; i++) {
  //     if (childNodes[i] === node) return true;
  //   }
  //   return false;
  // }
}
