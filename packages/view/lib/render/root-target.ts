import { RenderContext } from './render-context';
import { RenderTarget } from './target';

export class RootTarget {
  constructor(public context: RenderContext, public target: RenderTarget) {}

  appendChild(child: Node) {
    const { context, target } = this;
    target.appendChild(child);
    context.nodes.push(child);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    debugger;
  }
}
