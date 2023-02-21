import { Anchor, EventContext, RenderTarget } from '../jsx';
import { NextObserver } from '../jsx/observables';
import { DomNavigationOperation, DomOperationType } from './dom-operation';
import { ExecuteContext } from './execute-context';
import { contextKey } from './symbols';

export interface JsxEvent {
  name: keyof HTMLElementEventMap;
  nav: DomNavigationOperation[];
  handler: ((e: EventContext<any>) => any) | NextObserver<EventContext<any>>;
}

export function listen(
  container: HTMLElement,
  jsxEvent: JsxEvent,
  rootIdx: number
) {
  function handler(domEvent: Event) {
    const target = domEvent.target as Node;
    const root = resolveRootNode(container, target);

    if (!root) return;
    const context: ExecuteContext = (root as any)[contextKey];
    if (root !== getRootElementAt(context, rootIdx)) return;

    const { nav: navOps } = jsxEvent;

    let currentTarget = root;
    for (let i = 0, navLen = navOps.length; i < navLen; i++) {
      const nav = navOps[i];
      switch (nav.type) {
        case DomOperationType.PushChild:
          currentTarget = (currentTarget as Node).firstChild as Node;
          let offset = nav.index;
          while (offset--) currentTarget = currentTarget.nextSibling as Node;
          break;
        default:
          console.error('not supported', DomOperationType[nav.type]);
          break;
      }
    }

    if (currentTarget === target || currentTarget.contains(target)) {
      // const proxy = new Proxy(domEvent, {
      //   currentTarget,
      //   get(target: Event, prop: keyof Event) {
      //     if (prop === 'currentTarget') {
      //       return this.currentTarget;
      //     }
      //     return target[prop];
      //   },
      // } as any);

      const e: any = {
        data: context,
        event: domEvent as any,
        target: domEvent.target as any,
        currentTarget: currentTarget as any,
        type: jsxEvent.name,
        node: root,
      };
      if ('key' in domEvent) {
        e.key = domEvent.key;
      }

      if (jsxEvent.handler instanceof Function) jsxEvent.handler(e);
      else jsxEvent.handler.next(e);
    }
  }

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
}

export function resolveRootNode(
  container: RenderTarget<HTMLElement>,
  node: Node
) {
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
