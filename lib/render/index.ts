import { Disposable, disposeAll } from '../disposable';
import { isSubscribable } from '../util/observables';
import { isRenderable, RenderTarget } from '../jsx/renderable';
import { AnchorTarget } from './anchor-target';
import { TemplateInput } from '../jsx/template-input';
import { flatten } from '../jsx/_flatten';

export function render<T = any>(
  root: TemplateInput<T>,
  container: RenderTarget
): any {
  if (root === null || root === undefined) return root;

  if (root instanceof Array) {
    return flatten(root.map((elt) => render(elt, container)));
  }

  if (isRenderable(root)) {
    return root.render(container, null as any);
  }

  if (root instanceof Promise) {
    let cancelled = false;
    var anchor = new AnchorTarget(container);

    let bindings = root.then((e) => {
      if (!cancelled) {
        return render(e, anchor);
      }
    });
    return {
      dispose() {
        cancelled = true;
        return bindings.then(disposeAll);
      },
    };
  }

  if (isSubscribable(root)) {
    let binding: Disposable | null = null;
    var anchor = new AnchorTarget(container);

    const subs = root.subscribe({
      next(value) {
        disposeAll(binding);
        binding = render(value, anchor);
      },
    });

    return {
      dispose() {
        subs.unsubscribe();
      },
    };
  }

  if (root instanceof Node) {
    container.appendChild(root);
    return {
      dispose() {
        container.removeChild(root);
      },
    };
  }

  {
    // if all previous fail then add the root as text node to the provided container
    const textNode = document.createTextNode(root.toString());
    container.appendChild(textNode);
    return {
      dispose() {
        textNode.remove();
      },
    };
  }

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
