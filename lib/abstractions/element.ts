export interface ElementRef {
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
}

//import { Disposable } from '../template';

// export interface ElementRef {
//   appendChild(child: Node): void;

//   addEventListener(
//     target: Element,
//     type: string,
//     handler: Function,
//     context: any
//   ): Disposable;
// }

// class ElementRef {
//   private bindings: {
//     type: string;
//     target: Element;
//     handler: Function;
//     context: any;
//   }[] = [];

//   private handlers: { [type: string]: Function } = {};

//   constructor(public element: Element) {}

//   appendChild(child: Node): void {
//     this.element.appendChild(child);
//   }

//   addEventListener(
//     target: Element,
//     type: string,
//     handler: Function,
//     context: any
//   ): Disposable {
//     // this.target.addEventListener(type, handler);
//     const { handlers, bindings } = this;
//     if (!handlers[type]) {
//       const eventListener = function (ev: Event) {
//         if (!ev.target) return;
//         for (const binding of bindings) {
//           if (
//             binding.type === type &&
//             (binding.target.contains(ev.target as any) ||
//               binding.target === ev.target)
//           ) {
//             binding.handler(binding.context);
//           }
//         }
//       };
//       handlers[type] = eventListener;
//       this.element.addEventListener(type, eventListener);
//     }

//     const binding = { type, target, handler, context };
//     bindings.push(binding);

//     return {
//       dispose() {
//         const idx = bindings.indexOf(binding);
//         if (idx >= 0) {
//           bindings.splice(idx, 1);
//         }
//       },
//     };
//   }
// }
