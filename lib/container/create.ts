import { Template, RenderResult } from '../template';

import { compile, RenderOptions } from '../compile';
import {
  ContainerMutation,
  ContainerMutationManager,
  ContainerMutationType,
} from './mutation';
import { RowContext } from './row-context';
import { ElementRef } from '../abstractions/element';

export function createBla() {
  return null;
}

export interface ViewContainer<T> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  remove(values: T): void;
  map(mapper: (context: RowContext<T>) => Template): void;
}

export function createContainer<T>(): ViewContainer<T> {
  const mutations = new ContainerMutationManager<T>();
  return {
    map(mapper: (context: RowContext<T>) => Template) {
      const context = new RowContext<T>();
      const itemTemplate = mapper(context);
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
    push(items: T[], start: number, count: number): void {
      mutations.pushMutation({
        type: ContainerMutationType.PUSH_MANY,
        items,
        start,
        count,
      });
    },
    clear(): void {
      mutations.pushMutation({
        type: ContainerMutationType.CLEAR,
      });
    },
    remove(item: T): void {
      mutations.pushMutation({
        type: ContainerMutationType.REMOVE,
        item,
      });
    },
    swap(index1: number, index2: number) {
      mutations.pushMutation({
        type: ContainerMutationType.SWAP,
        index1,
        index2,
      });
    },
  };
}

// type RenderTarget = {
//   appendChild<T extends Node>(node: T): T;
//   addEventListener(): void;
// };

function createMutationsObserver<T>(
  containerElt: Element,
  template: {
    render: (target: ElementRef, options: RenderOptions) => RenderResult[];
  }
) {
  const renderResults: RenderResult[] = [];
  let renderResultsLength: number = 0;

  function pushMany(items: RenderResult[]) {
    for (let i = 0, len = items.length; i < len; i++)
      renderResults[renderResultsLength++] = items[i];
  }

  function moveNodes(nodes: Node[], toIndex: number) {
    if (nodes && nodes.length)
      for (let n = toIndex + 1; n < renderResultsLength; n++) {
        const rr = renderResults[n];
        if (rr.nodes.length) {
          const refNode = rr.nodes[0] as any;

          for (const node of nodes) {
            containerElt.insertBefore(node, refNode);
          }

          break;
        }
      }
  }

  const container = new ElementRef(containerElt);
  return {
    next(mut: ContainerMutation<T>) {
      switch (mut.type) {
        case ContainerMutationType.PUSH:
          pushMany(
            template.render(container, {
              items: [mut.values],
              start: 0,
              count: 1,
            })
          );
          break;
        case ContainerMutationType.PUSH_MANY:
          pushMany(template.render(container, mut));
          break;
        case ContainerMutationType.CLEAR:
          for (let i = 0, len = renderResultsLength; i < len; i++) {
            renderResults[i].dispose();
          }
          renderResultsLength = 0;
          break;
        case ContainerMutationType.REMOVE:
          const itemToRemove = mut.item;
          for (let i = 0; i < renderResultsLength; i++) {
            const rr = renderResults[i];

            if (rr.values === itemToRemove) {
              rr.dispose();
              renderResults.splice(i, 1);
              renderResultsLength--;
              break;
            }
          }
          break;
        case ContainerMutationType.MOVE:
          const { from, to } = mut;

          if (from < to) {
            const tmp = renderResults[from];
            for (let n = from; n < to; n++) {
              renderResults[n] = renderResults[n + 1];
            }
            renderResults[to] = tmp;
          } else {
            const tmp = renderResults[from];
            for (let n = from; n > to; n--) {
              renderResults[n] = renderResults[n - 1];
            }
            renderResults[to] = tmp;
          }

          moveNodes(renderResults[to].nodes, to);

          break;
        case ContainerMutationType.SWAP:
          const { index1, index2 } = mut;
          const nodes1 = renderResults[index1];
          const nodes2 = renderResults[index2];
          renderResults[index1] = renderResults[index2];
          renderResults[index2] = nodes1;

          moveNodes(nodes1.nodes, index2);
          moveNodes(nodes2.nodes, index1);

          break;
      }

      // function renderPush(target: Element, values: T) {
      //   const rr = template.render(target, [values], 0, 1);
      //   return rr;
      //   function remove() {
      //     flatTree(rr, (r) => r.dispose());
      //   }
      // }
    },
  };
}
