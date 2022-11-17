import { JsxElement } from '../jsx2/element';
import { RenderTarget } from '../jsx';

export interface ListProps<T> {
  data: T[];
}
export function List<T>(_: ListProps<T>, children: JsxElement[]) {
  return {
    render(target: RenderTarget) {
      for (const child of children) {
        child.render(target);
      }
    },
  };
}
