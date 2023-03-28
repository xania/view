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
  applyCommands,
  IfExpression,
  ListExpression,
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
  function traverse(stack: [RenderContext, RenderTarget, JSX.Element][]) {
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
        const stateNode = domFactory.createTextNode('');
        currentTarget.appendChild(stateNode);
        context.valueOperator(curr, {
          type: 'text',
          text: stateNode,
        });
      } else if (curr instanceof ListExpression) {
        const item = new State();
        const template = curr.children(item);

        const anchorNode = domFactory.createComment('---list---');
        const anchorTarget = new AnchorTarget(anchorNode);
        currentTarget.appendChild(anchorNode);

        const source = curr.source;
        if (source instanceof State) {
          context.valueOperator(source, {
            type: 'reduce',
            reduce(data, action) {
              if (action === undefined) {
                for (const row of data) {
                  const scope = new Map();
                  scope.set(item, row);

                  const childContext = new RenderContext(
                    context.container,
                    scope,
                    new Graph()
                  );
                  traverse([[childContext, anchorTarget, template]]);
                }
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
                      new Graph()
                    );
                    traverse([[childContext, anchorTarget, template]]);
                    break;
                }
              }
            },
          });
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
        context.promises.push(
          context.valueOperator(curr.condition, viewOperator)
        );

        // console.log(curr);
      } else if (curr instanceof Promise) {
        return curr.then((resolved): any => {
          if (resolved) {
            stack.push([context, currentTarget, resolved]);
          }
          return traverse(stack);
        });
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
              stack.push([context, element, curr.children]);
            }

            break;
          default:
            console.log('dom', curr);
            break;
        }
      } else {
        console.log('unknown', curr);
      }
    }

    return context;
  }

  const context = new RenderContext(container, new Map(), new Graph());
  return traverse([[context, context, rootChildren]]);
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
