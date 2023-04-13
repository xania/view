import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import type { RenderTarget } from './target';
import {
  Graph,
  RenderContext,
  SynthaticElement,
  ShowOperator,
} from './render-context';
import { DomFactory } from './dom-factory';
import { isAttachable } from './attachable';
import { isViewable } from './viewable';
import {
  IfExpression,
  isCommand,
  ROW_KEY_OFFSET,
  ItemState,
  ListExpression,
  ListMutationCommand,
  ListSource,
  State,
  StateEffect,
  GRAPHS_KEY_OFFSET,
} from '../reactive';
import { isSubscription } from './subscibable';
import { isDisposable } from './disposable';
import { isSubscribable } from '../reactive/observable';
import { Component } from '../component';
import { SequenceIterator, isIterable } from '../utils/iterator';
import { AnchorTarget } from './anchor-target';
import { RootTarget } from './root-target';
import { isEventKey } from '../intrinsic/event-keys';
import { tmap } from '../seq';

function renderStack(
  stack: [RenderContext, RenderTarget, JSX.Children][],
  domFactory: DomFactory
): Promise<any>[] {
  const promises: Promise<any>[] = [];
  while (stack.length) {
    const [context, currentTarget, curr] = stack.pop()!;
    if (context.disposed || curr === null || curr === undefined) {
      continue;
    } else if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        const item = curr[i];
        if (item !== null && item !== undefined) {
          stack.push([context, currentTarget, item]);
        }
      }
    } else if (curr instanceof SequenceIterator) {
      const next = curr.iter.next();
      if (!next.done) {
        stack.push([context, currentTarget, curr]);
      }
      stack.push([context, currentTarget, next.value]);
    } else if (curr.constructor === Number) {
      const textNode = domFactory.createTextNode(curr.toString());
      currentTarget.appendChild(textNode);
    } else if (curr instanceof Function) {
      const funcResult = curr();
      if (funcResult) {
        stack.push([context, currentTarget, funcResult]);
      }
    } else if (curr.constructor === String) {
      const textNode = domFactory.createTextNode(curr as string);
      currentTarget.appendChild(textNode);
    } else if (curr instanceof Component) {
      stack.push([context, currentTarget, curr.execute()]);
    } else if (curr instanceof State) {
      const stateNode = domFactory.createTextNode('');
      currentTarget.appendChild(stateNode);
      context.connect(curr, {
        type: 'text',
        text: stateNode,
      });
    } else if (curr instanceof StateEffect) {
      context.connect(curr.state, {
        type: 'effect',
        node: currentTarget as any,
        effect: curr.effect,
      });
    } else if (curr instanceof ListExpression) {
      const source =
        curr.source instanceof Array
          ? new ListSource(curr.source)
          : curr.source;

      const item = new ItemState(context, source);

      const disposeCmd = new ListMutationCommand(source, {
        type: 'dispose',
        list: source,
        context,
      });

      const template = tmap(curr.children, (child) => {
        if (child instanceof Function) {
          return child(item, disposeCmd);
        } else {
          return child;
        }
      });

      const listAnchorNode = domFactory.createComment('');
      const listAnchorTarget = new AnchorTarget(listAnchorNode);
      currentTarget.appendChild(listAnchorNode);

      context.connect(source, {
        type: 'reconcile',
        children: [],
        itemKey: source.key + ROW_KEY_OFFSET,
        graphsKey: source.key + GRAPHS_KEY_OFFSET,
        container: currentTarget as HTMLElement,
        listAnchorNode,
        template,
        render(contexts: RenderContext[]) {
          const stack: any[] = [];
          for (let i = contexts.length - 1; i >= 0; i--) {
            const childContext = contexts[i];
            stack.push([
              childContext,
              new RootTarget(
                childContext,
                childContext.anchorNode
                  ? new AnchorTarget(childContext.anchorNode)
                  : listAnchorTarget
              ),
              template,
            ]);
          }
          return Promise.all(renderStack(stack, domFactory));
        },
      });
    } else if (curr instanceof IfExpression) {
      const condition = curr.condition;
      if (condition instanceof State) {
        const anchorNode = domFactory.createComment('ifx');
        currentTarget.appendChild(anchorNode);

        const synthElt = new SynthaticElement(anchorNode);
        stack.push([context, synthElt, curr.content]);
        const showOperator: ShowOperator = {
          type: 'show',
          element: synthElt,
        };
        context.connect(condition, showOperator);
      } else if (condition) {
        stack.push([context, currentTarget, curr.content]);
      }
    } else if (curr instanceof Promise) {
      promises.push(
        curr.then((resolved): any => {
          if (resolved) {
            stack.push([context, currentTarget, resolved]);
          }
          return Promise.all(renderStack(stack, domFactory));
        })
      );
      return promises;
    } else if (isDomDescriptor(curr)) {
      switch (curr.type) {
        case DomDescriptorType.Element:
          const namespaceUri =
            curr.name === 'svg'
              ? 'http://www.w3.org/2000/svg'
              : (currentTarget as HTMLElement).namespaceURI ??
                'http://www.w3.org/1999/xhtml';
          const element = domFactory.createElementNS(namespaceUri, curr.name);
          currentTarget.appendChild(element);

          const { attrs } = curr;
          if (attrs) {
            for (const attrName in attrs) {
              const attrValue = attrs[attrName];

              renderAttr(context, element as Element, attrName, attrValue);
            }
          }

          const { children } = curr;
          if (children ?? true) {
            // concurrent mode
            promises.push(
              ...renderStack([[context, element, curr.children]], domFactory)
            );
          }
          break;
        case DomDescriptorType.Attribute:
          renderAttr(context, currentTarget as Element, curr.name, curr.value);
          break;
        default:
          console.log('dom', curr);
          break;
      }
    } else if (isViewable(curr)) {
      stack.push([context, currentTarget, curr.view()]);
    } else if (isAttachable(curr)) {
      stack.push([
        context,
        currentTarget,
        curr.attachTo(currentTarget, domFactory),
      ]);
    } else if (isSubscribable(curr)) {
      context.subscriptions.push(
        curr.subscribe({
          next(newValue) {
            context.handleCommands(newValue as any);
          },
        })
      );
    } else if (isDisposable(curr)) {
      context.disposables.push(curr);
    } else if (isSubscription(curr)) {
      context.subscriptions.push(curr);
    } else if (isCommand(curr)) {
      context.handleCommands(curr);
    } else if (isIterable(curr)) {
      stack.push([context, currentTarget, new SequenceIterator(curr)]);
    } else {
      console.log('unknown', curr);
    }
  }

  return promises;
}

export function render(
  rootChildren: JSX.Children,
  container: HTMLElement,
  domFactory: DomFactory = document
): JSX.Sequence<RenderContext> {
  const context = new RenderContext(container, new Graph(), 0);
  const promises = renderStack([[context, context, rootChildren]], domFactory);
  if (promises.length === 0) return context;
  return [promises, context];
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';

const emptyArr: string[] = [];

function split(x: string): string[] | undefined {
  if (x === null) {
    return emptyArr;
  }
  if (x === undefined) {
    return undefined;
  }
  return x.split(' ');
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';

function renderAttr(
  context: RenderContext,
  element: Element,
  attrName: string,
  attrValue: any
) {
  if (attrName === 'class' || attrName === 'className') {
    const stack: any[] = [attrValue];
    while (stack.length) {
      const curr = stack.pop();
      if (curr === undefined || curr === null) {
        // ignore
      } else if (curr instanceof Array) {
        stack.push(...curr);
      } else if (curr instanceof State) {
        context.connect(curr.map(split), {
          type: 'list',
          list: element.classList,
        });
      } else if (curr.constructor === String) {
        for (const item of curr.split(' ')) {
          const cl = item.trim();
          if (cl) {
            element.classList.add(cl);
          }
        }
      }
    }
  } else if (isEventKey(attrName)) {
    context.applyEvent(element as HTMLElement, attrName, attrValue);
  } else {
    const name = attrName === 'for' ? 'htmlFor' : attrName;

    if (attrValue === null || attrValue === undefined) {
      // ignore
    } else if (attrValue instanceof State) {
      context.connect(attrValue, {
        type: 'set',
        object: element as HTMLElement & Record<string, any>,
        prop: name,
      });
    } else {
      if (element.namespaceURI === 'http://www.w3.org/2000/svg')
        element.setAttribute(name, attrValue);
      else {
        (element as any)[name] = attrValue;
      }
    }
  }
}
