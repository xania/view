import { Disposable } from '../disposable';

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
export interface RenderContext {
  values: any;
  remove(): unknown;
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

export interface Renderable {
  render(target: RenderTarget, context?: RenderContext): Disposable;
}
