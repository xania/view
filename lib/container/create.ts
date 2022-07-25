import { Template } from '../template';

import { compile } from '../compile';
import {
  ContainerMutation,
  ContainerMutationManager,
  ContainerMutationType,
} from './mutation';
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
  update<K extends keyof T>(
    property: K,
    callback: (item: T, idx: number) => boolean
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

          const ss = mutations.subscribe(
            createMutationsObserver<T>(target, compiled)
          );

          return {
            dispose() {
              ss.unsubscribe();
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
    update(property: any, callback: (item: any, idx: number) => boolean) {
      const pairs: [any, number][] = [];
      for (let i = 0, len = data.length; i < len; i++) {
        const row = data[i];
        if (callback(data[i], i) === true) {
          pairs.push([row, i]);
        }
      }

      mutations.pushMutation({
        type: ContainerMutationType.UPDATE,
        property,
        pairs,
      });

      // if (index < 0 || index >= data.length) return;

      // const row = data[index] as any;
      // const oldValue = row[property];
      // const newValue =
      //   valueFn instanceof Function ? valueFn(oldValue) : valueFn;
      // if (newValue !== oldValue) {
      //   row[property] = newValue;
      //   mutations.pushMutation({
      //     type: ContainerMutationType.UPDATE,
      //     property,
      //     pairs: [[row, index]],
      //   });
      // }
    },
  } as any;
}

function createMutationsObserver<T>(
  containerElt: RenderTarget,
  template: CompileResult
) {
  template.listen(containerElt);

  const { customization } = template as any;

  return {
    next(mut: ContainerMutation<T>) {
      switch (mut.type) {
        case ContainerMutationType.PUSH_MANY:
          // const nodes = customization.nodes;
          template.render(containerElt, mut.items);
          break;
        case ContainerMutationType.CLEAR:
          if (customization) {
            const { nodes } = customization;
            const length = nodes.length;

            if (length) {
              if (containerElt.childNodes.length === length) {
                containerElt.textContent = '';
              } else {
                const rangeObj = new Range();
                rangeObj.setStartBefore(nodes[0]);
                rangeObj.setEndAfter(nodes[(length - 1) | 0]);

                rangeObj.deleteContents();
              }
            }
            nodes.length = 0;
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
            const { property, pairs } = mut;

            const operations = customization.updates[property as string];
            if (operations?.length) {
              const { nodes } = customization;
              execute(
                operations,
                pairs.map((p) => p[0]),
                (i) => nodes[pairs[i][1]]
              );
            }
          }
          break;
      }
    },
  };
}
