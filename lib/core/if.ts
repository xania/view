import { Renderable, RenderTarget } from '../jsx';
import { JsxElement } from '../jsx/element';
import { ExecuteContext } from '../render/execute-context';

export interface IfProps {
  condition: JSX.Subscribable<boolean>;
}

export function If<T>(props: IfProps, children: Renderable<T>[]) {
  return {
    render(target: RenderTarget) {
      const { condition } = props;

      const executeContext: ExecuteContext = {};

      var sub = condition.subscribe({
        next(b) {
          if (b) {
            for (const child of children) {
              if (child instanceof JsxElement) {
                const root = child.templateNode.cloneNode(true) as HTMLElement;
                executeContext.elements.push(root);
                // execute(child.content, root, executeContext);
                target.appendChild(root);
              }
            }
          } else {
            const { bindings, subscriptions, rootElement, moreRootElements } =
              executeContext;
            if (bindings) {
              for (const binding of bindings) {
                binding.dispose();
              }
              bindings.length = 0;
            }

            if (subscriptions) {
              for (const subscription of subscriptions) {
                subscription.unsubscribe();
              }
              subscriptions.length = 0;
            }

            if (rootElement) {
              rootElement.remove();
              executeContext.rootElement = undefined;
            }

            if (moreRootElements) {
              for (const elt of moreRootElements) {
                elt.remove();
              }
              moreRootElements.length = 0;
            }
          }
        },
      });

      return {
        dispose() {
          sub.unsubscribe();
          // bindings.map((x) => x.dispose());
        },
      };
    },
  };
}
