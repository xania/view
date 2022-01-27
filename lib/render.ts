import { compile } from './compile';
import { RenderTarget } from './renderable';
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
    const result = compile(element);
    if (result) {
      result.listen(containerElt);
      result.execute(containerElt, values);
    }
  }

  return null as any;
}
