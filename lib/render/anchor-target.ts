import { RenderTarget } from '../jsx/renderable';

export class AnchorTarget implements RenderTarget {
  childNodes: ArrayLike<Node>;
  anchorElt: Comment;

  /**
   *
   */
  constructor(public parent: RenderTarget) {
    this.childNodes = parent.childNodes;
    this.anchorElt = document.createComment('anchor');
    parent.appendChild(this.anchorElt);
  }
  removeChild(node: Node): void {
    this.parent.removeChild(node);
  }
  appendChild(node: Node): void {
    this.parent.insertBefore(node, this.anchorElt);
  }
  addEventListener(): void {
    throw new Error('addEventListener Method not implemented.');
  }
  removeEventListener(): void {
    throw new Error('removeEventListener Method not implemented.');
  }
  insertBefore: <T extends Node>(node: T, child: Node | null) => T = () => {
    throw new Error('insertBefore Not supported deprecated');
  };

  setAttribute?: ((qualifiedName: string, value: string) => void) | undefined =
    () => {
      throw new Error('setAttribute Method not implemented.');
    };

  set textContent(value: string | null) {
    throw new Error('textContent Method not implemented.' + value);
  }
}
