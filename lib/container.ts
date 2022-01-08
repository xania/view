import { Disposable } from './template';

export interface RenderContainer {
  appendChild(child: Node): void;

  addEventListener(
    target: Element,
    type: string,
    handler: Function,
    context: any
  ): Disposable;
}

export class ElementContainer implements RenderContainer {
  private bindings: {
    type: string;
    target: Element;
    handler: Function;
    context: any;
  }[] = [];

  private handlers: { [type: string]: Function } = {};

  constructor(public element: Element) {}

  appendChild(child: Node): void {
    this.element.appendChild(child);
  }

  addEventListener(
    target: Element,
    type: string,
    handler: Function,
    context: any
  ) {
    // this.target.addEventListener(type, handler);
    const { handlers, bindings } = this;
    if (!handlers[type]) {
      const eventListener = function (ev: Event) {
        if (!ev.target) return;
        for (const binding of bindings) {
          if (
            binding.type === type &&
            (binding.target.contains(ev.target as any) ||
              binding.target === ev.target)
          ) {
            binding.handler(binding.context);
          }
        }
      };
      handlers[type] = eventListener;
      this.element.addEventListener(type, eventListener);
    }
    bindings.push({ type, target, handler, context });

    return {
      dispose() {},
    };
  }
}
