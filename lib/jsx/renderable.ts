import { Disposable } from '../disposable';
import { IDomFactory } from '../render/dom-factory';
import { Unsubscribable } from './observables';

export interface RenderContext<T> {
  data: T;
}

export class Anchor<TNode> {
  public container: TNode;
  constructor(public child: { parentElement: TNode | undefined | null }) {
    if (!child.parentElement) throw Error('invalid operation');
    this.container = child.parentElement;
  }

  // appendChild(node: TNode) {
  //   this.container.insertBefore(node, this.child);
  // }

  // addEventListener<K extends keyof HTMLElementEventMap>(
  //   type: K,
  //   listener: EventListenerOrEventListenerObject, //  (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  //   options?: boolean | AddEventListenerOptions
  // ): void {
  //   this.container.addEventListener(type, listener, options);
  // }

  // removeEventListener<K extends keyof HTMLElementEventMap>(
  //   type: K,
  //   handler: EventListenerOrEventListenerObject, // (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  //   options?: boolean | EventListenerOptions
  // ): void {
  //   this.container.removeEventListener(type, handler, options);
  // }

  // insertBefore(node: TNode, child: TNode | null): TNode {
  //   return this.container.insertBefore(node, child);
  // }
}

export type RenderTarget<TNode> = TNode | Anchor<TNode>;

// export interface RenderContainer<TNode = HTMLElement> {
//   insertBefore(node: TNode, child: TNode | null): TNode;
//   // addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
//   // addEventListener: Node['addEventListener'];
//   // removeEventListener: Node['removeEventListener'];
// }
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
    target: Anchor<HTMLElement>,
    domFactory: IDomFactory<HTMLElement>,
    context: RenderContext<T>
  ):
    | JSX.Tree<Disposable | Unsubscribable>
    | Promise<JSX.Tree<Disposable | Unsubscribable>>;
}

export function isRenderable(value: any): value is Renderable<any> {
  return value && value.render instanceof Function;
}
