import { RenderTarget } from './target';

export class AnchorTarget implements RenderTarget {
  constructor(public anchorNode: Element) {}

  appendChild(child: Node) {
    const { anchorNode } = this;
    const { parentElement } = anchorNode;
    parentElement!.insertBefore(child, anchorNode);
  }

  addEventListener() {
    debugger;
  }
}
