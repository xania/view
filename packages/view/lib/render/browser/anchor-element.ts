import { RenderTarget } from '../../render/target';

export class AnchorElement implements RenderTarget {
  constructor(public container: Element, public anchorNode: ChildNode) {}

  appendChild(node: Node) {
    const { parentElement } = this.anchorNode;
    parentElement!.insertBefore(node, this.anchorNode);
  }
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    return this.container.addEventListener(type, listener, options);
  }

  static create(
    container: Element,
    anchorNode?: ChildNode | AnchorElement | undefined
  ) {
    if (!anchorNode) {
      return undefined;
    }

    if (anchorNode instanceof AnchorElement) {
      return new AnchorElement(container, anchorNode.anchorNode);
    } else {
      return new AnchorElement(container, anchorNode);
    }
  }
}
