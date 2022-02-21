import { compile } from './compile';
import { disposeKey } from './compile/helpers';
import { RenderTarget } from './renderable/render-target';

export function render<T>(
  element: any,
  container: RenderTarget | string,
  values?: T
) {
  const containerElt =
    typeof container === 'string'
      ? document.querySelector<HTMLDivElement>(container)
      : container;

  if (containerElt) {
    const result = compile(element, containerElt);
    if (result) {
      result.listen();
      return result.execute([values]);
    }
  }

  return [];
}

export function dispose(nodes: ReturnType<typeof render>) {
  for (const node of nodes) {
    const disposables = (node as any)[disposeKey];
    if (disposables) {
      if (Array.isArray(disposables)) {
        for (const disp of disposables) {
          disp.dispose();
        }
      } else {
        disposables.dispose();
      }
    }
    node.remove();
  }
}
