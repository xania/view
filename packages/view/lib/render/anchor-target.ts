import { RenderTarget } from './target';

export class AnchorTarget implements RenderTarget {
  constructor(public anchorNode: Comment) {}

  appendChild(child: Node) {
    const { anchorNode } = this;
    const { parentElement } = anchorNode;
    parentElement!.insertBefore(child, anchorNode);
  }

  addEventListener() {
    debugger;
  }
}
