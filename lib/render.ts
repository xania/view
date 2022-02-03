import { compile } from './compile';
import { RenderTarget } from './renderable/render-target';
import { Template } from './template';

export function render<T>(
  element: Template,
  container: RenderTarget | string,
  values?: T
): T {
  const containerElt =
    typeof container === 'string'
      ? document.querySelector<HTMLDivElement>(container)
      : container;

  if (containerElt) {
    const result = compile(element, containerElt);
    if (result) {
      result.listen();
      result.execute([values]);
    }
  }

  return null as any;
}
