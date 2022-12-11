import { RenderTarget } from '../jsx/renderable';

export class AnchorTarget implements RenderTarget {
  firstChild: ChildNode | null;
  childNodes: ArrayLike<Node>;
  anchorElt: ChildNode;

  /**
   *
   */
  constructor(public container: RenderTarget, anchorIdx: number) {
    this.childNodes = container.childNodes;
    const anchorNode = container.childNodes[anchorIdx] as ChildNode;

    this.anchorElt = anchorNode;
    this.firstChild = anchorNode;
  }
  removeChild(node: Node): void {
    if (node === this.firstChild) {
      this.firstChild = node.nextSibling;
    }
    this.container.removeChild(node);
  }
  appendChild(node: Node): void {
    const { firstChild } = this;
    if (firstChild === null) this.firstChild = node as ChildNode;
    this.container.insertBefore(node, this.anchorElt);
  }
  addEventListener(type: string, handler: any): void {
    this.container.addEventListener(type, handler);
    // throw new Error('addEventListener Method not implemented.');
  }
  removeEventListener(): void {
    throw new Error('removeEventListener Method not implemented.');
  }
  insertBefore: <T extends Node>(node: T, child: Node | null) => T = (
    node,
    child
  ) => {
    return this.container.insertBefore(node, child);
  };

  setAttribute?: ((qualifiedName: string, value: string) => void) | undefined =
    () => {
      throw new Error('setAttribute Method not implemented.');
    };

  set textContent(value: string | null) {
    throw new Error('textContent Method not implemented.' + value);
  }
}
