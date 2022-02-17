import { compile } from './compile';
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
