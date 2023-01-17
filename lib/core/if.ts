import { RenderTarget } from '../jsx';
import { compile } from '../render/compile';
import { BrowserDomFactory } from '../render/browser-dom-factory';
import { execute } from '../render/execute';
import { disposeContext, ExecuteContext } from '../render/execute-context';
import { Call } from '../ssr/hibernate';

export interface IfProps {
  condition: JSX.Observable<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
  return {
    ssr() {
      return new Call(If, [props]);
    },
    async render(target: RenderTarget) {
      const { condition } = props;

      const executeContext: ExecuteContext = {};
      const { renderOperations } = await compile(
        props.children,
        target,
        new BrowserDomFactory()
      );
      const subscription =
        condition.subscribe &&
        condition.subscribe({
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
