import { TemplateInput } from '../jsx/template-input';
import { compile } from './compile';
import { execute } from './execute';
import { disposeContext, ExecuteContext } from './execute-context';
import { listen } from './listen';
import { IDomFactory } from './dom-factory';
import { Anchor, RenderTarget } from '../jsx';
import { LazyOperation } from './dom-operation';
import { update } from './update';
import { BrowserDomFactory } from './browser-dom-factory';

export function render<T = any>(
  root: TemplateInput<T>,
  container: RenderTarget<HTMLElement>,
  domFactory: IDomFactory<HTMLElement> = new BrowserDomFactory()
): any {
  if (root === null || root === undefined) return root;

  // if (root instanceof JsxElement) {
  //   return renderElement(root, container);
  // }

  // if (root instanceof Array) {
  //   return flatten(root.map((elt) => render(elt, container)));
  // }

  // if (isRenderable(root)) {
  //   return root.render(container, null as any);
  // }

  if (root instanceof Promise) {
    return root.then((e: any) => render<T>(e, container, domFactory));
  } else {
    const execContext: ExecuteContext = {};

    return compile(root, container, domFactory).then((compileResult) => {
      const { renderOperations, events } = compileResult;

      execute(renderOperations, [execContext], domFactory);
      executeLazy(compileResult.lazyOperations, container);

      if (container instanceof Anchor) {
        const node = container.container;
        for (const [evt, rootIdx] of events) {
          listen(node, evt, rootIdx);
        }
      } else {
        for (const [evt, rootIdx] of events) {
          listen(container, evt, rootIdx);
        }
      } // for (const obs of observables) {
      //   const subs = obs.subscribe({
      //     binding: null as Promise<Disposable | null> | null,
      //     target: container,
      //     async next(value) {
      //       const { binding } = this;
      //       if (binding instanceof Promise) {
      //         binding.then(disposeAll);
      //       } else {
      //         disposeAll(binding);
      //       }
      //       this.binding = render(value, this.target);
      //     },
      //   });
      //   const { subscriptions } = execContext;
      //   if (subscriptions) subscriptions.push(subs);
      //   else execContext.subscriptions = [subs];
      // }

      return {
        dispose() {
          disposeContext(execContext);
        },
      };
    });
  }

  // if (isSubscribable(root)) {
  //   let binding: Disposable | null = null;

  //   const subs = root.subscribe({
  //     next(value) {
  //       disposeAll(binding);
  //       binding = render(value, container);
  //     },
  //   });

  //   return {
  //     dispose() {
  //       subs.unsubscribe();
  //     },
  //   };
  // }

  // if (root instanceof Node) {
  //   container.appendChild(root);
  //   return {
  //     dispose() {
  //       container.removeChild(root);
  //     },
  //   };
  // }

  // {
  //   // if all previous fail then add the root as text node to the provided container
  //   const textNode = document.createTextNode((root as any).toString());
  //   container.appendChild(textNode);
  //   return {
  //     dispose() {
  //       textNode.remove();
  //     },
  //   };
  // }

  // if (isExpressionTemplate(root)) {
  //   return root;
  // } else {
  //   const textNode = document.createTextNode(root.toString());
  //   container.appendChild(textNode);
  //   return {
  //     dispose() {
  //       textNode.remove();
  //     },
  //   };
  // }
}

export function executeLazy(
  lazyOperations: LazyOperation<any>[],
  target: RenderTarget<HTMLElement>
) {
  for (const op of lazyOperations) {
    op.lazy.lazy({
      next([item, newValue]: any) {
        if (!item) return;
        item[op.valueKey] = newValue;
        update([op.operation], [item]);

        // const { attachables } = op.lazy;
        // if (attachables?.length) {
        //   const node = item[op.nodeKey];
        //   const rootNode = resolveRootNode(target, node);
        //   if (rootNode) {
        //     for (const [n, f] of attachables) {
        //       if (rootNode.contains(n))
        //         f({
        //           data: item,
        //           node: n,
        //         } as ViewContext<any>);
        //     }
        //   }
        // }

        // if (prevValue) {
        //   ref.classList.remove(prevValue);
        // }

        // if (newValue) {
        //   const classes = jsxOpts?.classes;
        //   const cls = classes ? classes[newValue] : newValue;
        //   item[op.valueKey] = cls;

        //   ref.classList.add(cls);
        // }
      },
    });
  }
}

export * from './execute';
export * from './dom-operation';
