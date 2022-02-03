import { Template } from '../template';

import { compile } from '../compile';
import { ContainerMutationManager, ContainerMutationType } from './mutation';
import { RenderTarget } from '../renderable/render-target';

export interface ViewContainer<T = unknown> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  remove(node: Node): void;
  removeAt(index: number): void;
  map(template: JSX.Element): void;
  length: number;
  update<K extends keyof T>(
    node: Node,
    property: K,
    valueFn: (prev: T) => T[K]
  ): void;
  updateAt<K extends keyof T>(
    index: number,
    property: K,
    valueFn: (row: T) => T[K]
  ): void;
  // itemAt(index: number): T;
}

export function createContainer<T>(): ViewContainer<T> {
  const mutations = new ContainerMutationManager<T>();
  let length = 0;
  return {
    // itemAt(index: number): T {
    //   return data[index];
    // },
    get length() {
      return length;
    },
    map(itemTemplate: Template) {
      return {
        render(target: RenderTarget) {
          const compiled = compile(itemTemplate, target);
          if (!compiled) return undefined;

          const subscr = mutations.subscribe(compiled);

          return {
            dispose() {
              subscr.unsubscribe();
            },
          };
        },
      };
    },
    push(items: T[]): void {
      length += items.length;
      mutations.pushMutation({
        type: ContainerMutationType.PUSH_MANY,
        items,
      });
    },
    clear(): void {
      length = 0;
      mutations.pushMutation({
        type: ContainerMutationType.CLEAR,
      });
    },
    remove(node: Node): void {
      length--;
      mutations.pushMutation({
        type: ContainerMutationType.REMOVE,
        node,
      });
    },
    removeAt(index: number): void {
      if (index < length) {
        length--;
        mutations.pushMutation({
          type: ContainerMutationType.REMOVE_AT,
          index,
        });
      }
    },
    swap(index1: number, index2: number) {
      mutations.pushMutation({
        type: ContainerMutationType.SWAP,
        index1,
        index2,
      });
    },
    updateAt(index: number, property: any, valueFn: (prev: any) => any) {
      // if (index < 0 || index >= data.length) return;
      // const row = data[index] as any;
      // const oldValue = row[property];
      // const newValue = valueFn(oldValue);
      // if (newValue !== oldValue) {
      //   row[property] = newValue;
      //   mutations.pushMutation({
      //     type: ContainerMutationType.UPDATE,
      //     index,
      //     property,
      //     value: row,
      //   });
      // }
    },
    update(node: Node, property: any, valueFn: (prev: any) => any) {
      mutations.pushMutation({
        type: ContainerMutationType.UPDATE,
        node,
        property,
        valueFn,
      });
    },
  };
}

// function createMutationsObserver<T>(
//   containerElt: RenderTarget,
//   template: CompileResult
// ) {
//   template.listen();

//   // const { customization } = template;
//   const rootNodes: RenderTarget[] = [];

//   return {
//     next(mut: ContainerMutation<T>) {
//       switch (mut.type) {
//         case ContainerMutationType.PUSH_MANY:
//           // const nodes = customization.nodes;
//           const nodes = template.execute(mut.items);
//           const offset = rootNodes.length;
//           for (let i = nodes.length - 1; i >= 0; i--)
//             rootNodes[i + offset] = nodes[i];
//           break;
//         case ContainerMutationType.CLEAR:
//           if (customization) {
//             const { nodes } = customization;

//             if (rootNodes.length) {
//               // if (containerElt.childNodes.length === nodes.length) {
//               //   containerElt.textContent = '';
//               // } else {
//               var rangeObj = new Range();
//               // rangeObj.setStartBefore(nodes[0]);
//               // rangeObj.setEndAfter(nodes[nodes.length - 1]);

//               rangeObj.deleteContents();
//               // }
//             }
//             customization.nodes.length = 0;
//           }
//           break;
//         case ContainerMutationType.REMOVE_AT:
//           if (customization) {
//             const { nodes } = customization;
//             const { index } = mut;
//             const node = nodes[index];
//             // node.remove();
//             // containerElt.removeChild(node);
//             nodes.splice(index, 1);
//           }
//           break;
//         case ContainerMutationType.REMOVE:
//           const itemToRemove = mut.item;
//           if (customization) {
//             const { nodes } = customization;
//             for (let i = 0, len = nodes.length; i < len; i++) {
//               const rr = nodes[i] as any;

//               if (rr.values === itemToRemove) {
//                 containerElt.removeChild(rr);
//                 nodes.splice(i, 1);
//                 break;
//               }
//             }
//           }
//           break;
//         case ContainerMutationType.SWAP:
//           if (customization) {
//             const { nodes } = customization;
//             const { index1, index2 } = mut;

//             const node1 = nodes[index1];
//             const node2 = nodes[index2];

//             nodes[index1] = node2;
//             nodes[index2] = node1;

//             // containerElt.insertBefore(node1, nodes[index2 + 1]);
//             // containerElt.insertBefore(node2, nodes[index1 + 1]);
//           }

//           break;
//         case ContainerMutationType.UPDATE:
//           if (customization) {
//             const { property, index, value } = mut;

//             const operations = customization.updates[property as string];
//             if (operations?.length) {
//               execute(operations, customization.nodes, [value], index, 1);
//             }
//           }
//           break;
//       }
//     },
//   };
// }
