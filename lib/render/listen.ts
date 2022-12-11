import { RenderTarget } from '../jsx';
import { DomNavigationOperation, DomOperationType } from './dom-operation';
import { ExecuteContext } from './execute-context';
import { _context } from './symbols';

export interface JsxEvent {
  name: string;
  nav: DomNavigationOperation[];
  handler: (e: JSX.EventContext<any, any>) => any;
}

export function listen(container: RenderTarget, jsxEvent: JsxEvent) {
  container.addEventListener(
    jsxEvent.name === 'blur' ? 'focusout' : jsxEvent.name,
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
    const context: ExecuteContext = (root as any)[_context];

    let node: Node = context?.rootElement as Node;
    if (!node) return;

    const { nav: navOps } = jsxEvent;
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
      const e: JSX.EventContext<any, any> = {
        data: context,
        event: domEvent,
        node: root,
      };
      jsxEvent.handler(e);
    }
  }
}

function resolveRootNode(container: RenderTarget, node: Node) {
  let root = node;
  const rootParent = container.firstChild?.parentElement;
  while (root && root.parentNode !== rootParent) {
    root = root.parentNode as Node;
  }

  return root;
}
