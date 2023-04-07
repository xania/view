﻿import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
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
  CHILDREN_KEY_OFFSET,
  IfExpression,
  isCommand,
  ITEM_KEY_OFFSET,
  ItemState,
  ListExpression,
  ListMutationCommand,
  ListSource,
  State,
  StateEffect,
} from '../reactive';
import { isSubscription } from './subscibable';
import { isDisposable } from '../disposable';
import { isSubscribable } from '../reactive/observable';
import { Component } from '../component';
import { isIterable } from '../tpl/utils';
import { TemplateIterator } from '../tpl/iterator';
import { AnchorTarget } from './anchor-target';
import { RootTarget } from './root-target';

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
    } else if (curr instanceof TemplateIterator) {
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
      const template = curr.children(item, disposeCmd);

      const anchorNode = domFactory.createComment('');
      const anchorTarget = new AnchorTarget(anchorNode);
      currentTarget.appendChild(anchorNode);

      context.connect(source, {
        type: 'reconcile',
        childrenKey: source.key + CHILDREN_KEY_OFFSET,
        itemKey: source.key + ITEM_KEY_OFFSET,
        template,
        render(contexts: RenderContext[]) {
          const stack: any[] = [];
          for (let i = contexts.length - 1; i >= 0; i--) {
            const childContext = contexts[i];
            stack.push([
              childContext,
              new RootTarget(childContext, anchorTarget),
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
          const element = domFactory.createElement(curr.name);
          currentTarget.appendChild(element);

          const { classList } = curr;
          if (classList) {
            try {
              const stack: any[] = [classList];
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
            } catch (err) {
              debugger;
            }
          }

          const { attrs } = curr;
          if (attrs) {
            const target = element as HTMLElement & Record<string, any>;
            for (let i = 0, len = attrs.length; i < len; i++) {
              const { name, value } = attrs[i];
              if (value === null || value === undefined) {
                // ignore
              } else if (value instanceof State) {
                context.connect(value, {
                  type: 'set',
                  object: target,
                  prop: name,
                });
              } else {
                target[name] = value;
              }
            }
          }

          if (curr.events) {
            context.applyEvents(element as HTMLElement, curr.events);
          }

          const { children } = curr;
          if (children ?? true) {
            // concurrent mode
            promises.push(
              ...renderStack([[context, element, curr.children]], domFactory)
            );
          }
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
            context.handleCommand(newValue as any);
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
      stack.push([context, currentTarget, new TemplateIterator(curr)]);
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

function split(x: string): string[] {
  if (x === null) {
    return emptyArr;
  }
  return x.split(' ');
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';
