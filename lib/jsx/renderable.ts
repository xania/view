import { Unsubscribable } from '../util/is-subscibable';
import { Disposable } from '../disposable';
import { State } from '../state';

// export class RenderResult {
//   readonly nodes: Node[] = [];

//   constructor(public values: any) {}

//   dispose() {
//     const { nodes } = this;

//     for (const elt of nodes) {
//       (elt as any).remove();
//     }
//   }
// }
export interface RenderContext<T> {
  data: State<T>;
}

export interface RenderTarget {
  childNodes: ArrayLike<Node>;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  removeEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
  setAttribute?: HTMLElement['setAttribute'];
  set textContent(value: string | null);
}

export interface Renderable<T> {
  render(
    target: RenderTarget,
    context: RenderContext<T>
  ): Disposable | Unsubscribable;
}

export function isRenderable(value: any): value is Renderable<any> {
  return value && value.render instanceof Function;
}
