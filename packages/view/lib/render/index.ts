﻿import { templateAppend, templateBind } from '../tpl';
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
  rootTarget: RenderTarget,
  domFactory: DomFactory = document,
  context = new RenderContext(rootTarget, new Map(), new Graph())
): JSX.MaybePromise<RenderContext> {
  type Parent = { appendChild: RenderTarget['appendChild'] };
  function traverse(stack: [Parent, JSX.Element][]) {
    while (stack.length) {
      const [currentTarget, curr] = stack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      } else if (curr instanceof Array) {
        for (let i = curr.length - 1; i >= 0; i--) {
          const item = curr[i];
          if (item !== null && item !== undefined) {
            stack.push([currentTarget, item]);
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

        const source = curr.source;
        if (source instanceof State) {
          context.valueOperator(source, {
            type: 'reduce',
            reduce(data, action) {
              if (action === undefined) {
                for (const row of data) {
                  const scope = new Map();
                  scope.set(item, row);
                  render(
                    template,
                    currentTarget as HTMLElement,
                    domFactory,
                    new RenderContext(
                      currentTarget as HTMLElement,
                      scope,
                      new Graph(),
                      context
                    )
                  );
                }
              } else {
                const type = action.type;
                switch (type) {
                  case 'add':
                    const newRow = data[data.length - 1];
                    const scope = new Map();
                    scope.set(item, newRow);
                    render(
                      template,
                      currentTarget as HTMLElement,
                      domFactory,
                      new RenderContext(
                        currentTarget as HTMLElement,
                        scope,
                        new Graph(),
                        context
                      )
                    );
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
        stack.push([synthElt, curr.content]);
        const viewOperator: ViewOperator = {
          type: 'view',
          element: synthElt,
        };
        context.promises.push(
          context.valueOperator(curr.condition, viewOperator)
        );

        // console.log(curr);
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
              stack.push([element, curr.children]);
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

  return traverse([[context, rootChildren]]);
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';
