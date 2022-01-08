import {
  Template,
  TemplateType,
  ExpressionTemplate,
  RenderResult,
} from '../template';

import { compile, RenderOptions } from '../compile';
import { ExpressionType } from '../expression';
import { ElementContainer, RenderContainer } from '../container';
import {
  ListMutation,
  ListMutationManager,
  ListMutationType,
} from './list-mutation';

export class RowContext<T> {
  property(name: keyof T & string): ExpressionTemplate {
    return {
      type: TemplateType.Expression,
      expression: {
        type: ExpressionType.Property,
        name,
      },
    };
  }
  get<U>(getter: (row: T) => U) {
    return function (context: { values: T }) {
      if (context) return getter(context.values);
      return null;
    };
  }
  remove(context: { dispose: Function }) {
    if (context?.dispose) context.dispose();
  }
  call(func: (row: T, target: Element) => void) {
    return function (context: { values: T }) {
      func(context.values, null as any);
    };
  }
}
export function viewList<T>() {
  const mutations = new ListMutationManager<T>();
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
    add(mut: ListMutation<T>) {
      mutations.pushMutation(mut);
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
    render: (target: RenderContainer, options: RenderOptions) => RenderResult[];
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

  const container = new ElementContainer(containerElt);
  return {
    next(mut: ListMutation<T>) {
      switch (mut.type) {
        case ListMutationType.PUSH:
          pushMany(
            template.render(container, {
              items: [mut.values],
              start: 0,
              count: 1,
            })
          );
          break;
        case ListMutationType.PUSH_MANY:
          pushMany(template.render(container, mut));
          break;
        case ListMutationType.CLEAR:
          while (renderResultsLength) {
            renderResults[--renderResultsLength].dispose();
          }
          break;
        case ListMutationType.REMOVE:
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
        case ListMutationType.MOVE:
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
        case ListMutationType.SWAP:
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
