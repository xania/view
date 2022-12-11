import { disposeAll } from '../disposable';
import { RenderTarget } from '../jsx';
import { JsxElement } from '../jsx/element';
import { CloneOperation, DomOperationType } from './dom-operation';
import { ExecuteContext } from './execute-context';
import { execute } from './execute';
import { listen } from './listen';

export function renderElement2(element: JsxElement, target: RenderTarget) {
  const context: ExecuteContext = {};
  const cloneOp: CloneOperation = {
    type: DomOperationType.Clone,
    templateNode: element.templateNode,
    target,
  };
  // createEventListener(target);

  for (const ev of element.events) {
    listen(target, ev);
  }

  execute([cloneOp, ...element.contentOps], [context]);

  // if (context.rootElement) target.appendChild(context.rootElement);

  return {
    dispose() {
      if (context.bindings) disposeAll(context.bindings);
      if (context.rootElement) context.rootElement.remove();
      if (context.moreRootElements)
        for (const root of context.moreRootElements) root.remove();
      if (context.subscriptions)
        for (const sub of context.subscriptions) {
          sub.unsubscribe();
        }
    },
  };
}
