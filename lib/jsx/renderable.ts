import { Disposable } from '../disposable';

export interface RenderContext<T> {
  data: T;
}

export class Anchor {
  public container: HTMLElement;
  constructor(public child: Node) {
    if (!child.parentElement) throw Error('invalid operation');
    this.container = child.parentElement;
  }

  appendChild(node: Node) {
    this.container.insertBefore(node, this.child);
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.container.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    this.container.removeEventListener(type, listener, options);
  }

  insertBefore<T extends Node>(node: T, child: Node | null): T {
    return this.container.insertBefore(node, child);
  }
}

export type RenderTarget = HTMLElement | Anchor;

// export interface RenderTarget {
//   firstChild: Node['firstChild'];
//   childNodes: ArrayLike<Node>;
//   removeChild(node: Node): void;
//   appendChild(node: Node): void;
//   addEventListener: Node['addEventListener'];
//   removeEventListener(type: string, handler: (evt: Event) => void): void;
//   insertBefore: Node['insertBefore'];
//   setAttribute?: HTMLElement['setAttribute'];
//   set textContent(value: string | null);
// }

export interface Attachable {
  attachTo(elt: HTMLElement): any;
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
