import { createEventHandler, JsxElement } from '../jsx2/element';
import { RenderTarget } from '../jsx';
import { execute, ExecuteContext } from '../jsx2/execute';
import { ListMutationType, ListSource } from './list-source';
import { State } from '../state';

export interface ListProps<T> {
  source: T[] | ListSource<T>;
}

export function List<T>(props: ListProps<T>, children: JsxElement[]) {
  return {
    render(target: RenderTarget) {
      const sharedEventHandler = createEventHandler(target);
      const source = props.source;
      let virtualItems: VirtualItem[] = [];

      if (source instanceof Array) {
        renderChildren(source.map((e) => new State<T>(e)));
      } else if (source instanceof ListSource) {
        source.subscribe({
          next(mut) {
            switch (mut.type) {
              case ListMutationType.Append:
                renderChild(mut.item);
                break;
              case ListMutationType.Insert:
                renderChild(mut.item, mut.index);
                break;
              case ListMutationType.DeleteAt:
                deleteChild(mut.index);
                break;
            }
          },
        });
        renderChildren(source.properties);
      }

      function deleteChild(index: number) {
        const virtualItem = virtualItems[index];

        for (const binding of virtualItem.bindings) {
          binding.dispose();
        }
        for (const subscription of virtualItem.subscriptions) {
          subscription.unsubscribe();
        }

        for (const elt of virtualItem.elements) {
          elt.remove();
        }

        virtualItems.splice(index, 1);
      }

      function renderChild(
        item: State<T>,
        index: number = virtualItems.length
      ) {
        var executeContext: VirtualItem = {
          bindings: [],
          subscriptions: [],
          data: item,
          elements: [],
          key: Symbol(),
          push: sharedEventHandler,
        };

        let insertBeforeElt: HTMLElement | null = null;
        if (index < virtualItems.length) {
          virtualItems.splice(index, 0, executeContext);
          for (let i = index + 1; i < virtualItems.length; i++) {
            const next = virtualItems[i];
            if (next.elements.length) {
              insertBeforeElt = next.elements[0];
              break;
            }
          }
        } else virtualItems.push(executeContext);

        for (const child of children) {
          if (child instanceof JsxElement) {
            const root = child.templateNode.cloneNode(true) as HTMLElement;
            executeContext.elements.push(root);
            execute(child.content, root, executeContext);

            if (insertBeforeElt) target.insertBefore(root, insertBeforeElt);
            else target.appendChild(root);
          }
        }
      }

      function renderChildren(source: State<T>[]) {
        let v = 0,
          s = 0;
        const newItems: typeof virtualItems = new Array(source.length);
        while (v < virtualItems.length) {
          const virtualItem = virtualItems[v++];
          if (virtualItem.data === source[s]) {
            newItems[s++] = virtualItem;
          } else {
            for (const binding of virtualItem.bindings) {
              binding.dispose();
            }
            for (const subscription of virtualItem.subscriptions) {
              subscription.unsubscribe();
            }

            for (const elt of virtualItem.elements) {
              elt.remove();
            }
          }
        }
        virtualItems = newItems;

        for (let i = s, length = source.length; i < length; i++) {
          const data = source[i];
          var executeContext: VirtualItem = {
            bindings: [],
            subscriptions: [],
            data,
            elements: [],
            key: Symbol(),
            push: sharedEventHandler,
          };

          virtualItems[i] = executeContext;

          for (const child of children) {
            if (child instanceof JsxElement) {
              const root = child.templateNode.cloneNode(true) as HTMLElement;
              executeContext.elements.push(root);
              execute(child.content, root, executeContext);
              target.appendChild(root);
            }
          }

          data.subscribe({
            executeContext,
            next() {
              const virtualItem = this.executeContext;

              let i = 0;
              for (const child of children) {
                if (child instanceof JsxElement) {
                  const root = virtualItem.elements[i++];
                  execute(child.updates, root, virtualItem);
                }
              }
            },
          });
        }

        virtualItems.length = source.length;
      }
    },
  };
}

interface VirtualItem extends ExecuteContext {
  elements: HTMLElement[];
}
