import { templateAppend, templateBind } from '../tpl';
import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import type { Disposable } from '../disposable';
import {
  applyAttributes,
  applyClassList,
  applyEvents,
  renderStatic,
} from './render-node';
import { Program, View } from '../compile/program';
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
  ListExpression,
  ListMutationCommand,
  State,
  Stateful,
  StateMapper,
  UpdateCommand,
} from '../reactive';
import { resolve } from '../utils/resolve';

export function render(
  rootChildren: JSX.Element,
  container: HTMLElement,
  domFactory: DomFactory = document
): JSX.MaybePromise<RenderContext> {
  function traverse(
    stack: [RenderContext, RenderTarget, JSX.Element][]
  ): Promise<any>[] {
    const promises: Promise<any>[] = [];
    while (stack.length) {
      const [context, currentTarget, curr] = stack.pop()!;
      if (curr === null || curr === undefined) {
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
      } else if (curr.constructor === String) {
        const textNode = domFactory.createTextNode(curr);
        currentTarget.appendChild(textNode);
      } else if (curr instanceof State) {
        const stateNode = domFactory.createTextNode('..');
        currentTarget.appendChild(stateNode);
        promises.push(
          context.valueOperator(curr, {
            type: 'text',
            text: stateNode,
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
                    retval.push(childContext);
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
      } else {
        console.log('unknown', curr);
      }
    }

    return promises;
  }

  const context = new RenderContext(container, new Map(), new Graph(), 0);
  const promises = traverse([[context, context, rootChildren]]);
  if (promises.length === 0) return context;
  return Promise.all(promises).then(() => context);
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';

class AnchorTarget {
  constructor(public anchorNode: Comment) {}

  appendChild(child: Node) {
    const { anchorNode } = this;
    const { parentElement } = anchorNode;
    parentElement!.insertBefore(child, anchorNode);
  }
}

class RootTarget {
  constructor(public context: RenderContext, public target: RenderTarget) {}

  appendChild(child: Node) {
    const { context, target } = this;
    target.appendChild(child);
    context.nodes.push(child);
  }
}
