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
import { ViewContainer } from './types';

const index = Symbol('index');

export function createContainer<T>(): ViewContainer<T> {
  const mutations = new ContainerMutationManager<T>();
  const data: T[] = [];
  const vdata: any[] = [];
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

          compiled.listen(target);

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
      vdata.length = 0;
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
        vdata.splice(index, 1);
      }
    },
    swap(index1: number, index2: number) {
      let tmp = data[index1];
      data[index1] = data[index2];
      data[index2] = tmp;

      tmp = vdata[index1];
      vdata[index1] = vdata[index2];
      vdata[index2] = tmp;

      mutations.pushMutation({
        type: ContainerMutationType.SWAP,
        index1,
        index2,
      });
    },
    update(callback: (data: any[]) => void) {
      callback(data);

      mutations.pushMutation({
        type: ContainerMutationType.UPDATE,
        data,
        vdata,
      });
    },
  } as any;
}

function createMutationsObserver<T>(
  containerElt: RenderTarget,
  template: CompileResult
) {
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
            const { data, vdata } = mut;

            const { updates, nodes } = customization;
            for (const property in updates) {
              const operations = updates[property];
              if (!operations) break;
              const dirty: any[] = [];
              for (let i = 0, len = data.length; i < len; i++) {
                const item = data[i] as any;
                let vitem = vdata[i] as any;

                const newValue = item[property];
                if (vitem) {
                  const prevValue = vitem[property];
                  if (prevValue !== newValue) {
                    vitem[property] = newValue;
                    vitem[index] = i;
                    dirty.push(vitem);
                  }
                } else if (newValue !== null && newValue !== undefined) {
                  vitem = {
                    [property]: newValue,
                    [index]: i,
                  } as any;
                  vdata[i] = vitem;
                  dirty.push(vitem);
                }
              }
              if (dirty.length)
                execute(operations, dirty, (vitem) => {
                  const idx = vitem[index];
                  return nodes[idx];
                });
            }

            // for (const [row, idx, property] of pairs) {
            //   const operations = updates[property];
            //   if (operations) execute(operations, [row], () => nodes[idx]);
            // }

            // for (const property in updates) {
            //   const operations = updates[property];
            //   execute(
            //     operations,
            //     pairs.map((p) => p[0]),
            //     (i) => nodes[pairs[i][1]]
            //   );
            // }
          }
          break;
      }
    },
  };
}
