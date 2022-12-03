import { Renderable, RenderTarget } from '../jsx';
import { createExecuteContext, JsxElement } from '../jsx/element';
import { execute } from '../render/execute';

export interface IfProps {
  condition: JSX.Subscribable<boolean>;
}

export function If<T>(props: IfProps, children: Renderable<T>[]) {
  return {
    render(target: RenderTarget) {
      const { condition } = props;

      const executeContext = createExecuteContext(target, null);

      var sub = condition.subscribe({
        next(b) {
          if (b) {
            for (const child of children) {
              if (child instanceof JsxElement) {
                const root = child.templateNode.cloneNode(true) as HTMLElement;
                executeContext.elements.push(root);
                execute(child.content, root, executeContext);
                target.appendChild(root);
              }
            }
          } else {
            for (const binding of executeContext.bindings) {
              binding.dispose();
            }
            executeContext.bindings.length = 0;
            for (const subscription of executeContext.subscriptions) {
              subscription.unsubscribe();
            }
            executeContext.subscriptions.length = 0;
            for (const elt of executeContext.elements) {
              elt.remove();
            }
            executeContext.elements.length = 0;
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
