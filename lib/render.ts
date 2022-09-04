import { ViewBinding } from './binding';
import { Disposable } from './disposable';
import { RenderTarget } from './jsx/renderable';
import { Template } from './jsx/template';

export function render<T>(
  element: Template,
  container: RenderTarget | string,
  values?: T
): Disposable {
  const containerElt =
    typeof container === 'string'
      ? document.querySelector<HTMLDivElement>(container)
      : container;

  if (containerElt) {
    if (element) {
      const result = new ViewBinding(element, containerElt);
      result.render([values]);
      return result;
    }
  }

  return null as any;
}
