﻿import { execute } from '../../render/execute';
import { ListSource } from './list-source';
import { ListMutationType } from './mutation';
import { disposeContext, ExecuteContext } from '../../render/execute-context';
import { listen } from '../../render/listen';
import { Anchor, Context } from '../../jsx';
import { update } from '../../render/update';
import { compile } from '../../render/compile';
import { flatten } from '../../jsx/_flatten';
import { IDomFactory } from '../../render/dom-factory';
import { executeLazy } from '../../render';

export interface ListProps<T> {
  source: T[] | ListSource<T>;
  children: JSX.Tree<JSX.Children | ((row: Context<T>) => JSX.Children)>;
}

export * from './list-source';
export * from './mutation';

export function List<T extends ExecuteContext>(props: ListProps<T>) {
  const template = flatten(props.children, new Context<T>());
  if (template.length > 1)
    throw new Error('more than 1 child is not yet supported');

  return {
    children: template,
    async render(target: Anchor, domFactory: IDomFactory) {
      const source = props.source;

      const { updateOperations, renderOperations, events, lazyOperations } =
        await compile(template, target, domFactory);

      executeLazy(lazyOperations, target);

      for (const [evt, rootIdx] of events) listen(target, evt, rootIdx);

      function clear(from: ExecuteContext, to: ExecuteContext) {
        const firstElement = from.rootElement as Node;
        const lastElement = findLastElement(to) as Node;

        if (
          !(target instanceof Anchor) &&
          firstElement === target.firstChild &&
          lastElement.nextSibling === null
        ) {
          target.textContent = '';
          return;
        }

        const rangeObj = new Range();
        rangeObj.setStartBefore(firstElement);
        rangeObj.setEndAfter(lastElement);

        rangeObj.deleteContents();
      }

      function moveChild(from: ExecuteContext, to: ExecuteContext) {
        if (from === to) return;

        const referenceNode = to.rootElement ?? null;

        if (from.rootElement)
          target.insertBefore(from.rootElement, referenceNode);
        if (from.moreRootElements)
          for (const elt of from.moreRootElements) {
            target.insertBefore(elt, referenceNode);
          }
      }

      function renderChildren(source: ArrayLike<ExecuteContext>) {
        execute(renderOperations, source, domFactory);
      }

      if (source instanceof Array) {
        renderChildren(source);
      } else if (source instanceof ListSource) {
        source.subscribe({
          next(mut) {
            switch (mut.type) {
              // case ListMutationType.Push:
              //   renderChild(mut.item);
              //   break;
              // case ListMutationType.Insert:
              //   renderChild(mut.item, mut.index);
              //   break;
              case ListMutationType.Delete:
                disposeContext(mut.item);
                break;
              case ListMutationType.Clear:
                clear(mut.firstItem, mut.lastItem);
                break;
              case ListMutationType.Move:
                moveChild(mut.item, mut.beforeItem);
                break;
              case ListMutationType.Update:
                update(updateOperations, mut.items);
                break;
              case ListMutationType.Concat:
                renderChildren(mut.items);
                break;
            }
          },
        });
        renderChildren(source.snapshot);
      }
    },
  };
}

function findLastElement(xc: ExecuteContext) {
  const { moreRootElements } = xc;
  if (moreRootElements?.length) {
    const last = moreRootElements[moreRootElements.length - 1];
    return last;
  } else {
    return xc.rootElement ?? null;
  }
}