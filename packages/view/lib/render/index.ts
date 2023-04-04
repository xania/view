import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import { applyClassList } from './render-node';
import type { RenderTarget } from './target';
import {
  Graph,
  RenderContext,
  SynthaticElement,
  ViewOperator,
} from './render-context';
import { DomFactory } from './dom-factory';
import { isAttachable } from './attachable';
import { isViewable } from './viewable';
import {
  IfExpression,
  isCommand,
  ListExpression,
  ListMutationCommand,
  State,
  StateEffect,
} from '../reactive';
import { isSubscription } from './subscibable';
import { isDisposable } from '../disposable';
import { isSubscribable } from '../reactive/observable';
import { Component } from '../component';

export function render(
  rootChildren: JSX.Element,
  container: HTMLElement,
  domFactory: DomFactory = document
): JSX.Template<RenderContext> {
  function traverse(
    stack: [RenderContext, RenderTarget, JSX.MaybePromise<JSX.Element>][]
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
      } else if (curr.constructor === Number) {
        const textNode = domFactory.createTextNode(curr.toString());
        currentTarget.appendChild(textNode);
      } else if (curr instanceof Function) {
        const funcResult = curr();
        if (funcResult) {
          stack.push([context, currentTarget, funcResult]);
        }
      } else if (curr.constructor === String) {
        const textNode = domFactory.createTextNode(curr);
        currentTarget.appendChild(textNode);
      } else if (curr instanceof Component) {
        stack.push([context, currentTarget, curr.execute()]);
      } else if (curr instanceof State) {
        const stateNode = domFactory.createTextNode('..');
        currentTarget.appendChild(stateNode);
        promises.push(
          context.valueOperator(curr, {
            type: 'text',
            text: stateNode,
          })
        );
      } else if (curr instanceof StateEffect) {
        promises.push(
          context.valueOperator(curr.state, {
            type: 'effect',
            node: currentTarget as any,
            effect: curr.effect,
          })
        );
      } else if (curr instanceof ListExpression) {
        const item = new State();
        const source = curr.source;

        const disposeCmd = new ListMutationCommand(item, {
          type: 'dispose',
          source,
        });
        const template = curr.children(item, disposeCmd);

        const anchorNode = domFactory.createComment('');
        const anchorTarget = new AnchorTarget(anchorNode);
        currentTarget.appendChild(anchorNode);

        if (source instanceof State) {
          promises.push(
            context.valueOperator(source, {
              type: 'reconcile',
              async reconcile(data, retval, action) {
                if (action === undefined) {
                  const stack: any[] = [];

                  for (let i = data.length - 1; i >= 0; i--) {
                    const scope = new Map();
                    scope.set(item, data[i]);

                    const childContext = new RenderContext(
                      context.container,
                      scope,
                      new Graph(),
                      i,
                      context
                    );
                    retval[i] = childContext;
                    stack.push([
                      childContext,
                      new RootTarget(childContext, anchorTarget),
                      template,
                    ]);
                  }

                  await Promise.all(traverse(stack));
                } else {
                  const type = action.type;
                  switch (type) {
                    case 'add':
                      const newRow = data[data.length - 1];
                      const scope = new Map();
                      scope.set(item, newRow);

                      const childContext = new RenderContext(
                        context.container,
                        scope,
                        new Graph(),
                        retval.length,
                        context
                      );
                      retval.push(childContext);
                      await Promise.all(
                        traverse([
                          [
                            childContext,
                            new RootTarget(childContext, anchorTarget),
                            template,
                          ],
                        ])
                      );
                      break;
                    case 'remove':
                      retval[action.index].dispose();
                      retval.splice(action.index, 1);
                      for (let i = action.index; i < retval.length; i++) {
                        retval[i].index = i;
                      }
                      break;
                  }
                }
              },
            })
          );
        }
      } else if (curr instanceof IfExpression) {
        const anchorNode = domFactory.createComment('ifx');
        currentTarget.appendChild(anchorNode);

        const synthElt = new SynthaticElement(anchorNode);
        stack.push([context, synthElt, curr.content]);
        const viewOperator: ViewOperator = {
          type: 'view',
          element: synthElt,
        };
        promises.push(context.valueOperator(curr.condition, viewOperator));

        // console.log(curr);
      } else if (curr instanceof Promise) {
        promises.push(
          curr.then((resolved): any => {
            if (resolved) {
              stack.push([context, currentTarget, resolved]);
            }
            return Promise.all(traverse(stack));
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
                    context.valueOperator(curr.map(split), {
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
                  context.valueOperator(value, {
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
              promises.push(...traverse([[context, element, curr.children]]));
            }
            break;
          default:
            console.log('dom', curr);
            break;
        }
      } else if (isViewable(curr)) {
        stack.push([context, currentTarget, curr.view()]);
      } else if (isAttachable(curr)) {
        promises.push(register([curr.attachTo(currentTarget, domFactory)]));

        async function register(stack: any[]) {
          while (stack.length) {
            const res = stack.pop();
            if (res instanceof Promise) {
              stack.push(await res);
            } else if (res instanceof Array) {
              stack.push(...res);
            } else if (res) {
              if (isSubscription(res)) {
                context.subscriptions.push(res);
              } else if (isDisposable(res)) {
                context.disposables.push(res);
              }
            }
          }
        }
      } else if (isSubscribable(curr)) {
        context.subscriptions.push(
          curr.subscribe({
            next(newValue) {
              context.applyCommands(newValue as any);
              // textNode.data = newValue?.toString() ?? '';
            },
          })
        );
      } else if (isDisposable(curr)) {
        context.disposables.push(curr);
      } else if (isSubscription(curr)) {
        context.subscriptions.push(curr);
      } else if (isCommand(curr)) {
        context.applyCommands(curr);
      } else {
        console.log('unknown', curr);
      }
    }

    return promises;
  }

  const context = new RenderContext(container, new Map(), new Graph(), 0);
  const promises = traverse([[context, context, rootChildren]]);
  if (promises.length === 0) return context;
  return [promises, context];
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';

class AnchorTarget implements RenderTarget {
  constructor(public anchorNode: Comment) {}

  appendChild(child: Node) {
    const { anchorNode } = this;
    const { parentElement } = anchorNode;
    parentElement!.insertBefore(child, anchorNode);
  }

  addEventListener() {
    debugger;
  }
}

class RootTarget {
  constructor(public context: RenderContext, public target: RenderTarget) {}

  appendChild(child: Node) {
    const { context, target } = this;
    target.appendChild(child);
    context.nodes.push(child);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    debugger;
  }
}

const emptyArr: string[] = [];

function split(x: string): string[] {
  if (x === null) {
    return emptyArr;
  }
  return x.split(' ');
}
