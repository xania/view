import { Anchor, EventContext, RenderTarget } from '../jsx';
import { DomNavigationOperation, DomOperationType } from './dom-operation';
import { ExecuteContext } from './execute-context';
import { contextKey } from './symbols';

export interface JsxEvent {
  name: keyof HTMLElementEventMap;
  nav: DomNavigationOperation[];
  handler: (e: EventContext<any, any>) => any;
}

export function listen(
  container: RenderTarget,
  jsxEvent: JsxEvent,
  rootIdx: number
) {
  container.addEventListener(
    jsxEvent.name === 'blur' ? 'focusout' : (jsxEvent.name as any),
    handler,
    true
  );

  return {
    dispose() {
      container.removeEventListener(jsxEvent.name, handler);
    },
  };

  function handler(domEvent: Event) {
    const target = domEvent.target as Node;
    const root = resolveRootNode(container, target);

    if (!root) return;
    const context: ExecuteContext = (root as any)[contextKey];
    if (root !== getRootElementAt(context, rootIdx)) return;

    const { nav: navOps } = jsxEvent;

    let node = root;
    for (let i = 0, navLen = navOps.length; i < navLen; i++) {
      const nav = navOps[i];
      switch (nav.type) {
        case DomOperationType.PushChild:
          node = (node as Node).firstChild as Node;
          let offset = nav.index;
          while (offset--) node = node.nextSibling as Node;
          break;
        default:
          console.error('not supported', DomOperationType[nav.type]);
          break;
      }
    }

    if (node === target || node.contains(target)) {
      const e: EventContext<any, any> = {
        data: context,
        event: domEvent,
        node: root,
      };
      jsxEvent.handler(e);
    }
  }
}

export function resolveRootNode(container: RenderTarget, node: Node) {
  let root = node;
  const rootParent =
    container instanceof Anchor ? container.container : container;
  while (root && root.parentNode !== rootParent) {
    root = root.parentNode as Node;
  }

  return root;
}

function getRootElementAt(context: ExecuteContext, rootIdx: number) {
  if (rootIdx === 0) return context.rootElement;

  if (rootIdx > 0 && context?.moreRootElements)
    return context.moreRootElements[rootIdx - 1];

  return null;
}
