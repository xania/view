import { RenderTarget } from '../renderable/render-target';
import { DomOperationType } from './dom-operation';
import { component, distinct, NodeCustomization } from './helpers';

export function addEventDelegation(
  rootContainer: RenderTarget,
  customization?: NodeCustomization
) {
  if (!customization) return;

  function getRootNode(node: Node | null): Node | null {
    if (!node) return null;
    if ((node as any)[component]) return node;
    return getRootNode(node.parentNode);
  }

  for (const eventName of distinct(Object.keys(customization.events))) {
    rootContainer.addEventListener(eventName, (evt: Event) => {
      const eventName = evt.type;
      const eventTarget = evt.target as Node;

      if (!eventTarget) return;
      const rootNode = getRootNode(eventTarget as Node) as HTMLElement;
      if (!rootNode) return;
      const customization = (rootNode as any)[component] as NodeCustomization;

      const operations = customization.events[eventName];
      if (!operations || !operations.length) return;

      const renderStack: Node[] = [rootNode];
      let renderIndex = 0;
      for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
        const operation = operations[n];
        const curr = renderStack[renderIndex];
        switch (operation.type) {
          case DomOperationType.PushChild:
            renderStack[++renderIndex] = curr.childNodes[
              operation.index
            ] as HTMLElement;
            break;
          case DomOperationType.PushFirstChild:
            renderStack[++renderIndex] = curr.firstChild as HTMLElement;
            break;
          case DomOperationType.PushNextSibling:
            renderStack[++renderIndex] = curr.nextSibling as HTMLElement;
            break;
          case DomOperationType.PopNode:
            renderIndex--;
            break;
          case DomOperationType.AddEventListener:
            if (eventTarget === curr || curr.contains(eventTarget)) {
              operation.handler({ node: rootNode, event: evt });
            }
            break;
        }
      }
    });
  }
}
