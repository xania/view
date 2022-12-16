import { Renderable, RenderTarget } from '../jsx';
import { compile } from '../render/compile';
import { execute } from '../render/execute';
import { disposeContext, ExecuteContext } from '../render/execute-context';

export interface IfProps {
  condition: JSX.Subscribable<boolean>;
}

export function If<T>(props: IfProps, children: Renderable<T>[]) {
  return {
    async render(target: RenderTarget) {
      const { condition } = props;

      const executeContext: ExecuteContext = {};
      const { renderOperations } = await compile(children, target);
      const subscription = condition.subscribe({
        next(b) {
          if (b) {
            execute(renderOperations, [executeContext]);

            // for (const child of children) {
            //   if (child instanceof JsxElement) {
            //     const root = child.templateNode.cloneNode(true) as HTMLElement;
            //     executeContext.rootElement = root;
            //     // execute(child.content, root, executeContext);
            //     target.appendChild(root);
            //   }
            // }
          } else {
            disposeContext(executeContext);
          }
        },
      });

      return {
        dispose() {
          disposeContext(executeContext);
          subscription.unsubscribe();
        },
      };
    },
  };
}
