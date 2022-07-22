import { Template } from '../template';

import { compile } from '../compile';
import {
  ContainerMutation,
  ContainerMutationManager,
  ContainerMutationType,
} from './mutation';
import { JSX } from '../../types/jsx';
import { RenderTarget } from '../renderable/render-target';
import { CompileResult } from '../compile/compile-result';
import { execute } from '../compile/execute';

export interface ViewContainer<T = unknown> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  removeAt(index: number): void;
  map(template: JSX.Element): void;
  length: number;
  updateAt<K extends keyof T>(
    index: number,
    property: K,
    valueFn: (prev: T[K]) => T[K]
  ): void;
  itemAt(index: number): T;
}

export function createContainer<T>(): ViewContainer<T> {
  const mutations = new ContainerMutationManager<T>();
  const data: T[] = [];
  return {
    itemAt(index: number): T {
      return data[index];
    },
    get length() {
      return data.length;
    },
    map(itemTemplate: Template) {
      return {
        render(target: RenderTarget) {
          const compiled = compile(itemTemplate);
          if (!compiled) return undefined;

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
    removeAt(index: number): void {
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
    updateAt(index: number, property: any, valueFn: (prev: any) => any) {
      if (index < 0 || index >= data.length) return;

      const row = data[index] as any;
      const oldValue = row[property];
      const newValue = valueFn(oldValue);
      if (newValue !== oldValue) {
        row[property] = newValue;
        mutations.pushMutation({
          type: ContainerMutationType.UPDATE,
          index,
          property,
          value: row,
        });
      }
    },
  };
}

function createMutationsObserver<T>(
  containerElt: RenderTarget,
  template: CompileResult
) {
  template.listen(containerElt);

  const { customization } = template;

  return {
    next(mut: ContainerMutation<T>) {
      switch (mut.type) {
        case ContainerMutationType.PUSH_MANY:
          // const nodes = customization.nodes;
          template.execute(containerElt, mut.items);
          break;
        case ContainerMutationType.CLEAR:
          if (customization) {
            const { nodes } = customization;

            if (nodes.length) {
              // if (containerElt.childNodes.length === nodes.length) {
              //   containerElt.textContent = '';
              // } else {
              var rangeObj = new Range();
              // rangeObj.setStartBefore(nodes[0]);
              // rangeObj.setEndAfter(nodes[nodes.length - 1]);

              rangeObj.deleteContents();
              // }
            }
            customization.nodes.length = 0;
          }
          break;
        case ContainerMutationType.REMOVE_AT:
          if (customization) {
            const { nodes } = customization;
            const { index } = mut;
            const node = nodes[index];
            // node.remove();
            // containerElt.removeChild(node);
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

            // containerElt.insertBefore(node1, nodes[index2 + 1]);
            // containerElt.insertBefore(node2, nodes[index1 + 1]);
          }

          break;
        case ContainerMutationType.UPDATE:
          if (customization) {
            const { property, index, value } = mut;

            const operations = customization.updates[property as string];
            if (operations?.length) {
              execute(operations, customization.nodes, [value], index, 1);
            }
          }
          break;
      }
    },
  };
}
