import { RenderTarget } from './render-target';

export function createScope(
  targetElement: RenderTarget,
  refNode: Node
): RenderTarget {
  const childNodes = targetElement.childNodes;
  return {
    childNodes,
    removeChild(node: Node) {
      targetElement.removeChild(node);
    },
    appendChild(node: Node) {
      targetElement.insertBefore(node, refNode);
    },
    addEventListener(
      type: string,
      handler: (this: Element, event: Event) => void
    ) {
      targetElement.addEventListener(type, handler);
    },
    insertBefore<T extends Node>(node: T, child: Node | null) {
      return targetElement.insertBefore(node, child);
    },
  };
}
