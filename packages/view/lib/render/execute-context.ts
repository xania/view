import { Disposable } from '../disposable';
import { Unsubscribable } from '../jsx/observables';

export interface ExecuteContext extends Record<string | number | symbol, any> {
  bindings?: Disposable[];
  subscriptions?: Unsubscribable[];
  rootElement?: HTMLElement;
  moreRootElements?: HTMLElement[];
}

export function disposeContext(xc: ExecuteContext) {
  if (!xc) return;

  const { bindings, subscriptions, rootElement, moreRootElements } = xc;

  if (bindings) {
    let blength = bindings.length;
    while (blength--) {
      bindings[blength].dispose();
    }
  }

  if (subscriptions) {
    let slength = subscriptions.length;
    while (slength--) {
      subscriptions[slength].unsubscribe();
    }
  }

  if (rootElement) rootElement.remove();

  if (moreRootElements) {
    let elength = moreRootElements.length;
    while (elength--) {
      moreRootElements[elength].remove();
    }
  }
}
