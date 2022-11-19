import { createEventManager, JsxElement } from '../jsx2/element';
import { RenderTarget } from '../jsx';
import { execute, ExecuteContext } from '../jsx2/execute';
import { Subscribable } from '../util/is-subscibable';
import { State } from '../state';

export function useListSource<T>(initial?: T[]) {
  return new State<T[]>(initial);
}

export interface ListProps<T> {
  source: T[] | Subscribable<T[]>;
}

export function List<T>(props: ListProps<T>, children: JsxElement[]) {
  return {
    render(target: RenderTarget) {
      const sharedEventManager = createEventManager(target);
      const source = props.source;
      let virtualItems: VirtualItem[] = [];

      if (source instanceof Array) {
        renderChildren(source);
      } else if (source) {
        const current = (source as any)['current'];
        if (current) {
          renderChildren(current);
        }
        source.subscribe({
          next: renderChildren,
        });
      }

      function renderChildren(source: T[]) {
        let v = 0,
          s = 0;
        const newItems: typeof virtualItems = new Array(source.length);
        while (v < virtualItems.length) {
          const virtualItem = virtualItems[v++];
          if (virtualItem.values === source[s]) {
            newItems[s++] = virtualItem;

            // let index = 0;
            // for (const child of children) {
            //   if (child instanceof JsxElement) {
            //     execute(
            //       child.updates,
            //       virtualItem.elements[index++],
            //       virtualItem
            //     );
            //   }
            // }
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
          var executeContext: VirtualItem = {
            bindings: [],
            subscriptions: [],
            values: source[i],
            handlers: sharedEventManager,
            elements: [],
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
        }

        virtualItems.length = source.length;
      }
    },
  };
}

interface VirtualItem extends ExecuteContext {
  elements: HTMLElement[];
}

type ListMutation = never;
