import { Template } from '../template';

import { compile, CompileResult } from '../compile';
import {
  ContainerMutation,
  ContainerMutationManager,
  ContainerMutationType,
} from './mutation';
import { ViewContext } from './row-context';

export interface ViewContainer<T> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  remove(context: ViewContext<T>): void;
  map(template: Template): void;
  length: number;
  updateAt(index: number, updater: (data: T) => any): void;
}

export function createContainer<T>(): ViewContainer<T> {
  const mutations = new ContainerMutationManager<T>();
  const data: T[] = [];
  return {
    get length() {
      return data.length;
    },
    map(itemTemplate: Template) {
      const compiled = compile(itemTemplate);
      return {
        render({ target }: { target: Element }) {
          const subscr = mutations.subscribe(
            createMutationsObserver<T>(target, compiled)
          );
          return {
            dispose() {
              subscr.unsubscribe();
            },
          };
        },
      };
    },
    push(items: T[]): void {
      const offset = data.length;
      data.length += items.length;
      for (let i = 0, len = items.length; i < len; i++) {
        data[i + offset] = items[i];
      }
      mutations.pushMutation({
        type: ContainerMutationType.PUSH_MANY,
        items,
      });
    },
    clear(): void {
      data.length = 0;
      mutations.pushMutation({
        type: ContainerMutationType.CLEAR,
      });
    },
    remove(context: ViewContext<T>): void {
      const { values } = context;
      const index = data.indexOf(values);
      if (index >= 0) {
        mutations.pushMutation({
          type: ContainerMutationType.REMOVE_AT,
          index,
        });

        data.splice(index, 1);
      }
    },
    swap(index1: number, index2: number) {
      const tmp = data[index1];
      data[index1] = data[index2];
      data[index2] = tmp;

      mutations.pushMutation({
        type: ContainerMutationType.SWAP,
        index1,
        index2,
      });
    },
    updateAt(index: number, updater: (item: T) => void) {
      const values = data[index];
      updater(values);
      mutations.pushMutation({
        type: ContainerMutationType.UPDATE,
        index,
        values: values,
      });
    },
  };
}

function createMutationsObserver<T>(
  containerElt: Element,
  template: CompileResult
) {
  template.listen(containerElt);

  const { customization } = template;

  return {
    next(mut: ContainerMutation<T>) {
      switch (mut.type) {
        case ContainerMutationType.PUSH_MANY:
          const { items } = mut;
          if (customization) {
            const cust = customization;
            const { nodes } = cust;
            let nodesLen = nodes.length;
            for (let i = 0, len = items.length; i < len; i++) {
              const rootNode = cust.templateNode.cloneNode(true);
              containerElt.appendChild(rootNode);
              cust.nodes[nodesLen++] = rootNode;
            }
            template.update(nodes, nodesLen - items.length, items);
          }

          break;
        case ContainerMutationType.CLEAR:
          if (customization) {
            // containerElt.textContent = '';
            var rangeObj = new Range();
            const { nodes } = customization;

            if (nodes.length) {
              rangeObj.setStartBefore(nodes[0]);
              rangeObj.setEndAfter(nodes[nodes.length - 1]);

              rangeObj.deleteContents();
            }
            customization.nodes.length = 0;
          }
          break;
        case ContainerMutationType.REMOVE_AT:
          if (customization) {
            const { nodes } = customization;
            const { index } = mut;
            const node = nodes[index];
            containerElt.removeChild(node);
            nodes.splice(index, 1);
          }
          break;
        case ContainerMutationType.REMOVE:
          const itemToRemove = mut.item;
          if (customization) {
            const { nodes } = customization;
            for (let i = 0, len = nodes.length; i < len; i++) {
              const rr = nodes[i] as any;

              if (rr.values === itemToRemove) {
                containerElt.removeChild(rr);
                nodes.splice(i, 1);
                break;
              }
            }
          }
          break;
        case ContainerMutationType.SWAP:
          if (customization) {
            const { nodes } = customization;
            const { index1, index2 } = mut;

            const node1 = nodes[index1];
            const node2 = nodes[index2];

            nodes[index1] = node2;
            nodes[index2] = node1;

            containerElt.insertBefore(node1, nodes[index2 + 1]);
            containerElt.insertBefore(node2, nodes[index1 + 1]);
          }

          break;
        case ContainerMutationType.UPDATE:
          if (customization) {
            const { values, index } = mut;
            template.update(customization.nodes, index, [values]);
          }
          break;
      }
    },
  };
}
