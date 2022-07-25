import { RenderTarget } from '../renderable/render-target';

export class FragmentTarget implements RenderTarget {
  constructor(
    private parentElement: RenderTarget,
    public childNodes: ArrayLike<Node>
  ) {}

  set textContent(value: string) {
    const { childNodes, parentElement } = this;
    if (parentElement) {
      for (let i = 0, len = childNodes.length; i < len; i++) {
        this.parentElement.removeChild(childNodes[i]);
      }
      if (value) {
        const textNode = document.createTextNode(value);
        this.parentElement.appendChild(textNode);
        this.childNodes = [textNode];
      } else {
        this.childNodes = [];
      }
    }
  }

  get firstChild() {
    return this.childNodes[0];
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
