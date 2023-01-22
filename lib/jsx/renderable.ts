import { Disposable } from '../disposable';
import { IDomFactory } from '../render/dom-factory';
import { Unsubscribable } from './observables';

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

  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    this.container.removeEventListener(type, handler, options);
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
    domFactory: IDomFactory,
    context: RenderContext<T>
  ): JSX.Tree<Disposable | Unsubscribable>;
}

export function isRenderable(value: any): value is Renderable<any> {
  return value && value.render instanceof Function;
}
