import { Disposable } from '../disposable';

export interface RenderContext<T> {
  data: T;
}

export interface RenderTarget {
  firstChild: Node['firstChild'];
  childNodes: ArrayLike<Node>;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
  addEventListener: Node['addEventListener'];
  removeEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
  setAttribute?: HTMLElement['setAttribute'];
  set textContent(value: string | null);
}

export interface Renderable<T> {
  render(
    target: RenderTarget,
    context: RenderContext<T>
  ): Disposable | JSX.Unsubscribable;
}

export function isRenderable(value: any): value is Renderable<any> {
  return value && value.render instanceof Function;
}
