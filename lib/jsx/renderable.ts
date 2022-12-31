import { Disposable } from '../disposable';

export interface RenderContext<T> {
  data: T;
}

export class Anchor {
  public container: RenderContainer;
  constructor(public child: Node) {
    if (!child.parentElement) throw Error('invalid operation');
    this.container = child.parentElement;
  }

  appendChild(node: Node) {
    this.container.insertBefore(node, this.child);
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: RenderContainer, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.container.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: RenderContainer, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    this.container.removeEventListener(type, handler, options);
  }

  insertBefore<T extends Node>(node: T, child: Node | null): T {
    return this.container.insertBefore(node, child);
  }
}

export type RenderTarget = RenderContainer | Anchor;

export interface RenderContainer {
  insertBefore: Node['insertBefore'];
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: RenderContainer, ev: HTMLElementEventMap[K]) => any,
    opts?: boolean | EventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: RenderContainer, ev: HTMLElementEventMap[K]) => any,
    opts?: boolean | EventListenerOptions
  ): void;
  childNodes: ArrayLike<Node>;
  firstChild: Node['firstChild'];
  textContent: Node['textContent'];
  appendChild(node: Node): void;
}
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
