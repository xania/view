// import { RenderTarget } from '../renderable';

// export class AnchorTarget implements RenderTarget {
//   parentElement: HTMLElement | null;

//   constructor(private anchor: Node) {
//     this.parentElement = anchor.parentElement;
//   }

//   set textContent(value: string) {
//     const { childNodes, parentElement } = this;
//     if (parentElement) {
//       for (let i = 0, len = childNodes.length; i < len; i++) {
//         parentElement.removeChild(childNodes[i]);
//       }
//       if (value) {
//         const textNode = document.createTextNode(value);
//         parentElement.appendChild(textNode);
//         this.childNodes = [textNode];
//       } else {
//         this.childNodes = [];
//       }
//     }
//   }

//   remove() {
//     this.removeChild(this.anchor);
//   }

//   removeChild(node: Node): void {
//     const { parentElement } = this;
//     if (parentElement) parentElement.removeChild(node);
//   }

//   appendChild(child: Node): void {
//     const { parentElement, anchor } = this;
//     if (parentElement) parentElement.insertBefore(child, anchor);
//   }
//   insertBefore<T extends Node>(node: T, child: Node | null) {
//     const { parentElement } = this;
//     if (parentElement) parentElement.insertBefore(node, child);
//     return node;
//   }
//   addEventListener(type: string, handler: (evt: Event) => void): void {
//     const { parentElement } = this;
//     if (parentElement) parentElement.addEventListener(type, handler);
//   }
//   removeEventListener(type: string, handler: (evt: Event) => void): void {
//     const { parentElement } = this;
//     if (parentElement) parentElement.removeEventListener(type, handler);
//   }

//   childNodes: ArrayLike<Node> = [];

//   contains() {
//     return false;
//   }
// }
