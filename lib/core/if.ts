import { RenderTarget } from '../jsx';
import { compile } from '../render/compile';
import { execute } from '../render/execute';
import { disposeContext, ExecuteContext } from '../render/execute-context';
import { Call } from '../ssr/hibernate';
import { IDomFactory } from '../render/dom-factory';

export interface IfProps {
  condition: JSX.Observable<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
  return {
    ssr() {
      return new Call(If, [props]);
    },
    async render(target: RenderTarget, domFactory: IDomFactory) {
      const { condition } = props;

      const executeContext: ExecuteContext = {};
      const { renderOperations } = await compile(
        props.children,
        target,
        domFactory
      );
      const subscription =
        condition.subscribe &&
        condition.subscribe({
          next(b) {
            if (b) {
              execute(renderOperations, [executeContext], domFactory);

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
