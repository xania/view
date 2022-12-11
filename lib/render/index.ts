import { Disposable, disposeAll } from '../disposable';
import { isSubscribable } from '../util/observables';
import { isRenderable, RenderTarget } from '../jsx/renderable';
import { TemplateInput } from '../jsx/template-input';
import { flatten } from '../jsx/_flatten';
import { JsxElement } from '../jsx/element';
import { renderElement } from './render-element';

export function render<T = any>(
  root: TemplateInput<T>,
  container: RenderTarget
): any {
  if (root === null || root === undefined) return root;

  if (root instanceof JsxElement) {
    return renderElement(root, container);
  }

  if (root instanceof Array) {
    return flatten(root.map((elt) => render(elt, container)));
  }

  if (isRenderable(root)) {
    return root.render(container, null as any);
  }

  if (root instanceof Promise) {
    let cancelled = false;

    let bindings = root.then((e) => {
      if (!cancelled) {
        return render(e, container);
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

    const subs = root.subscribe({
      next(value) {
        disposeAll(binding);
        binding = render(value, container);
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
    const textNode = document.createTextNode((root as any).toString());
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
