// import { component, values } from './symbols';
// import { execute } from './execute';
// import { CompileResult, NodeCustomization } from './compile/compile-result';
// import { ViewMutation, ViewMutationType } from './mutation';
// import { Template } from './jsx';
// import { RenderTarget } from './jsx';
// import { compile } from './compile';
// import { distinct } from './util/helpers';
// import { DomOperationType } from './compile/dom-operation';

// export class ViewBinding {
//   public vdata: any[] = [];
//   public customizations: NodeCustomization[];
//   constructor(
//     template: Template | CompileResult,
//     private target: RenderTarget
//   ) {
//     const compiled = compile(template);
//     if (compiled) {
//       this.customizations = compiled.customizations;
//     } else {
//       this.customizations = [];
//     }
//     this.listen();
//   }

//   get elements() {
//     const { vdata, customizations } = this;
//     const r: any[] = [];
//     for (const cust of customizations) {
//       const { dom } = cust;
//       for (const vitem of vdata) {
//         const elt = vitem[dom];
//         r.push(elt);
//       }
//     }

//     return r;
//   }

//   dispose() {
//     this.clear();
//   }

//   next(mut: ViewMutation) {
//     switch (mut.type) {
//       case ViewMutationType.CLEAR:
//         this.clear();
//         break;
//       case ViewMutationType.REMOVE_AT:
//         this.removeAt(mut.index);
//         break;
//       case ViewMutationType.MOVE:
//         this.moveTo(mut.from, mut.to);
//         break;
//       case ViewMutationType.RENDER:
//         this.render(mut.data);
//         break;
//     }
//   }

//   private listen() {
//     const { customizations, target: rootContainer, vdata } = this;
//     for (const customization of customizations) {
//       const eventNames = distinct(Object.keys(customization.events));
//       for (const eventName of eventNames) {
//         rootContainer.addEventListener(eventName, handler);
//       }
//     }

//     return {
//       unsubscribe() {
//         // for (const eventName of eventNames) {
//         //   rootContainer.removeEventListener(eventName, handler);
//         // }
//       },
//     };
//     function handler(evt: Event) {
//       const eventName = evt.type;
//       const eventTarget = evt.target as Node;

//       let rootNode: Node | null = eventTarget;
//       if (!rootNode) return;
//       let cust: NodeCustomization | null = null;

//       do {
//         cust = (rootNode as any)[component] as NodeCustomization;
//         if (cust) break;
//       } while ((rootNode = rootNode.parentNode));

//       if (!customizations.includes(cust) || !rootNode) return;

//       const { dom } = cust;

//       const operations = cust.events[eventName];
//       if (!operations || !operations.length) return;

//       const renderStack: Node[] = [rootNode];
//       let renderIndex = 0;
//       for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
//         const operation = operations[n];
//         const curr = renderStack[renderIndex];
//         switch (operation.type) {
//           case DomOperationType.PushChild:
//             renderStack[++renderIndex] = curr.childNodes[
//               operation.index
//             ] as HTMLElement;
//             break;
//           case DomOperationType.PushFirstChild:
//             renderStack[++renderIndex] = curr.firstChild as HTMLElement;
//             break;
//           case DomOperationType.PushNextSibling:
//             renderStack[renderIndex] = curr.nextSibling as HTMLElement;
//             break;
//           case DomOperationType.PopNode:
//             renderIndex--;
//             break;
//           case DomOperationType.AddEventListener:
//             if (eventTarget === curr || curr.contains(eventTarget)) {
//               for (let i = 0; i < vdata.length; i++) {
//                 const vitem = vdata[i];
//                 if (vitem[dom] === rootNode) {
//                   operation.handler({
//                     index: i,
//                     values: vitem[values],
//                     event: evt,
//                   });
//                 }
//               }
//             }
//             break;
//         }
//       }
//     }
//   }

//   removeAt(index: number) {
//     const { target, customizations, vdata } = this;
//     for (const cust of customizations) {
//       const { dom } = cust;
//       target.removeChild(vdata[index][dom]);
//       vdata.splice(index, 1);
//     }
//   }

//   clear() {
//     const { vdata, customizations } = this;

//     for (const cust of customizations) {
//       const { dom } = cust;

//       for (const vitem of vdata) {
//         vitem[dom].remove();
//       }
//     }

//     // if (length) {
//     //   if (target.childNodes.length === length) {
//     //     target.textContent = '';
//     //   } else {
//     //     const rangeObj = new Range();
//     //     // rangeObj.setStartBefore(vdata[0][dom]);
//     //     // rangeObj.setEndAfter(vdata[length - 1][dom]);

//     //     rangeObj.deleteContents();
//     //   }
//     // }
//     vdata.length = 0;
//   }

//   render(data: ArrayLike<any>) {
//     const { vdata, customizations, target } = this;

//     const length = data.length;
//     const vlength = vdata.length;

//     for (let i = vlength; i < length; i++) {
//       const item = data[i] as any;
//       const vitem: any = {
//         [values]: item,
//       };
//       vdata.push(vitem);
//     }

//     for (const customization of customizations) {
//       const { updates, dom } = customization;

//       if (length > vlength) {
//         const { templateNode } = customization;
//         for (let i = vlength; i < length; i++) {
//           const clone = templateNode.cloneNode(true);
//           (clone as any)[component] = customization;
//           target.appendChild(clone);
//           const item = data[i] as any;
//           const vitem = vdata[i];
//           vitem[dom] = clone;
//           if (item) {
//             for (const property in updates) {
//               const newValue = item[property];
//               vitem[property] = newValue;
//             }
//           }
//         }
//         execute(
//           customization.render,
//           {
//             target,
//             data: vdata,
//             offset: vlength,
//           },
//           customization.dom,
//           values
//         );
//       }

//       if (vlength > length) {
//         for (let i = length; i < vlength; i++) {
//           this.vdata[i][dom].remove();
//         }

//         this.vdata.length = length;
//       }

//       if (length > 0) {
//         for (const property in updates) {
//           const operations = updates[property];
//           if (!operations) break;
//           const dirty: any[] = [];
//           for (let i = 0; i < length; i++) {
//             const item = data[i] as any;
//             let vitem = vdata[i] as any;
//             vitem[values] = item;

//             if (!item) {
//               continue;
//             }

//             const newValue = item[property];
//             vitem[values] = item;
//             const prevValue = vitem[property];
//             if (prevValue !== newValue) {
//               vitem[property] = newValue;
//               dirty.push(vitem);
//             }
//           }
//           if (dirty.length)
//             execute(
//               operations,
//               {
//                 target,
//                 data: dirty,
//                 offset: 0,
//               },
//               customization.dom,
//               values
//             );
//         }
//       }
//     }
//   }

//   moveTo(from: number, to: number) {
//     if (from === to) {
//       return;
//     }
//     const { vdata, customizations } = this;
//     const fromItem = vdata[from];
//     const toItem = vdata[to];
//     if (from < to) {
//       for (let i = from + 1; i <= to; i++) {
//         vdata[i - 1] = vdata[i];
//       }
//     } else if (from > to) {
//       for (let i = from; i > to; i--) {
//         vdata[i] = vdata[i - 1];
//       }
//     }
//     vdata[to] = fromItem;
//     for (const cust of customizations) {
//       const { dom } = cust;
//       const fromNode: HTMLElement = fromItem[dom];
//       const toNode: HTMLElement = toItem[dom];

//       if (from < to) {
//         toNode.insertAdjacentElement('afterend', fromNode);
//       } else if (from > to) {
//         toNode.insertAdjacentElement('beforebegin', fromNode);
//       }
//     }
//   }
// }
