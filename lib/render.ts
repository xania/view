import { ViewBinding } from './compile/binding';
import type { RenderTarget } from './renderable';
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
    if (element) {
      const result = new ViewBinding(element, containerElt);
      result.render([values]);
    }
  }

  return null as any;
}
