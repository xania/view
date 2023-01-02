import { Anchor, RenderContainer } from '../jsx/renderable';
import { TemplateInput } from '../jsx/template-input';
import { compile } from './compile';
import { execute } from './execute';
import { disposeContext, ExecuteContext } from './execute-context';
import { listen } from './listen';

export function render<T = any>(
  root: TemplateInput<T>,
  container: RenderContainer | Anchor
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
    return root.then((e: any) => render(e, container));
  } else {
    const execContext: ExecuteContext = {};
    return compile(root, container).then((compileResult) => {
      const { renderOperations, events } = compileResult;

      execute(renderOperations, [execContext], container);

      for (const [evt, rootIdx] of events) listen(container, evt, rootIdx);
      // for (const obs of observables) {
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

export * from './execute';
