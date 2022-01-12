import { Template } from '../template';

import { compile, CompileResult, RenderOptions } from '../compile';
import {
  ContainerMutation,
  ContainerMutationManager,
  ContainerMutationType,
} from './mutation';
import { RowContext } from './row-context';

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
  template: CompileResult
) {
  template.listen(containerElt);

  const renderResults: Node[] = [];
  let renderResultsLength: number = 0;

  function pushMany(items: Node[]) {
    for (let i = 0, len = items.length; i < len; i++)
      renderResults[renderResultsLength++] = items[i];
  }

  function moveNodes(nodes: Node[], toIndex: number) {
    const count = template.templateNodes.length;
    const refNode = renderResults[toIndex + count];

    for (let i = 0; i < nodes.length; i++) {
      containerElt.insertBefore(nodes[i], refNode);
    }
  }

  return {
    next(mut: ContainerMutation<T>) {
      const count = template.templateNodes.length;
      switch (mut.type) {
        case ContainerMutationType.PUSH:
          pushMany(
            template.render(containerElt, {
              items: [mut.values],
              start: 0,
              count: 1,
            })
          );
          break;
        case ContainerMutationType.PUSH_MANY:
          pushMany(template.render(containerElt, mut));
          break;
        case ContainerMutationType.CLEAR:
          containerElt.textContent = '';
          // var rangeObj = new Range();

          // if (renderResultsLength) {
          //   rangeObj.setStartBefore(renderResults[0].nodes[0]);
          //   rangeObj.setEndAfter(
          //     renderResults[renderResultsLength - 1].nodes[0]
          //   );

          //   rangeObj.deleteContents();
          // }
          renderResultsLength = 0;
          break;
        case ContainerMutationType.REMOVE:
          const itemToRemove = mut.item;
          for (let i = 0; i < renderResultsLength; i++) {
            const rr = renderResults[i] as any;

            if (rr.values === itemToRemove) {
              containerElt.removeChild(rr);
              renderResults.splice(i, 1);
              renderResultsLength--;
              break;
            }
          }
          break;
        case ContainerMutationType.MOVE:
          const { from: f, to: t } = mut;
          const from = f * count;
          const to = t * count;

          const tmp = renderResults.slice(from, count);
          if (from < to) {
            for (let n = from * count; n < to; n++) {
              renderResults[n] = renderResults[n + count];
            }
            for (let i = 0; i < count; i++) {
              renderResults[to + i] = tmp[i];
            }
          } else {
            for (let n = from; n > to; n--) {
              renderResults[n] = renderResults[n - 1];
            }

            for (let i = 0; i < count; i++) {
              renderResults[to + i] = tmp[i];
            }
          }

          moveNodes(tmp, to);

          break;
        case ContainerMutationType.SWAP:
          const { index1: i1, index2: i2 } = mut;
          const index1 = i1 * count;
          const index2 = i2 * count;

          const nodes1 = renderResults.slice(index1, index1 + count);
          const nodes2 = renderResults.slice(index2, index2 + count);

          for (let i = 0; i < count; i++) {
            renderResults[index1 + i] = nodes2[i];
          }
          for (let i = 0; i < count; i++) {
            renderResults[index2 + i] = nodes1[i];
          }

          moveNodes(nodes1, index2);
          moveNodes(nodes2, index1);

          break;
        case ContainerMutationType.UPDATE:
          break;
      }
    },
  };
}
