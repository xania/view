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
  State,
  Stateful,
  StateMapper,
} from '../reactive';
import { resolve } from '../utils/resolve';
import { ListMutation } from '../reactive/list/mutation';

export function render(
  rootChildren: JSX.Element,
  rootTarget: RenderTarget,
  domFactory: DomFactory = document,
  context: RenderContext = new RenderContext(rootTarget, new Map(), new Graph())
): JSX.Template<Node | View | Disposable> {
  function binder(
    value: NonNullable<JSX.Value>,
    currentTarget: RenderTarget
  ): JSX.Template<Node | View | Disposable> {
    if (value instanceof Node) {
      currentTarget.appendChild(value.cloneNode(true));
      return value;
    } else if (value instanceof Program) {
      const view = value.attachTo(currentTarget, domFactory);
      return [view, ...view.render()];
    } else if (value instanceof IfExpression) {
      const anchorNode = domFactory.createComment('ifx');
      currentTarget.appendChild(anchorNode);

      const synthElt = new SynthaticElement(anchorNode);
      const contentResult = templateBind(value.content, binder, synthElt);
      const viewOperator: ViewOperator = {
        type: 'view',
        element: synthElt,
      };
      context.graph.valueOperator(value.condition, viewOperator);

      return [
        anchorNode,
        contentResult,
        resolve(value.condition.initial, (initial) => {
          if (initial) {
            synthElt.attach();
          }
          return synthElt;
        }),
      ];
    } else if (value instanceof ListExpression) {
      const item = new State();
      const template = value.children(item);

      if (value.source instanceof State) {
        const source = value.source;
        return resolve(initial(context, source), (initial) => {
          const textNode = domFactory.createTextNode('!');
          currentTarget.appendChild(textNode);

          context.set(source, initial instanceof Array ? [...initial] : []);

          context.valueOperator(source, {
            type: 'list',
            apply(data, mutation?: ListMutation<any>) {
              if (mutation) {
                switch (mutation.type) {
                  case 'add':
                    const scope = new Map();
                    scope.set(item, mutation.item);

                    render(
                      template,
                      currentTarget,
                      domFactory,
                      new RenderContext(
                        currentTarget,
                        scope,
                        new Graph(),
                        context
                      )
                    );

                    console.log(mutation.item);
                    break;
                }
              }
            },
          });
          return textNode;
        });

        //   return new ListExpresion(
        //     new ListSource<T>(props.source),
        //     item,
        //     props.children(item)
        //   );
      } else if (value.source instanceof State) {
        //   return new ListExpresion(props.source, item, props.children(item));
      } else {
        return value.source.map((x) => {
          const scope = new Map();
          scope.set(item, x);
          return render(
            template,
            currentTarget,
            domFactory,
            new RenderContext(currentTarget, scope, new Graph(), context)
          );
        });
      }
    } else if (isDomDescriptor(value)) {
      switch (value.type) {
        case DomDescriptorType.StaticElement:
          const staticNode = renderStatic(value, domFactory);
          currentTarget.appendChild(staticNode);
          return staticNode;
        case DomDescriptorType.Element:
          const elementNode = domFactory.createElement(value.name);
          if (value.attrs) {
            applyAttributes(elementNode, value.attrs);
          }
          if (value.classList) {
            applyClassList(elementNode, value.classList);
          }
          currentTarget.appendChild(elementNode);
          /** wrap promise inside an array (or any object) to render children concurrently */

          const result: JSX.MaybePromise<Node | Disposable | View>[] = [
            elementNode,
          ];

          const eventsResult = applyEvents(value.events, elementNode, context);
          if (eventsResult) {
            result.push(...eventsResult);
          }

          const childrenResult = templateBind(
            value.children,
            binder,
            elementNode
          );
          templateAppend(result, childrenResult);
          return result;

        case DomDescriptorType.Text:
          const textNode = domFactory.createTextNode(value.text);
          currentTarget.appendChild(textNode);
          return textNode;
        case DomDescriptorType.Data:
          const dataNode = domFactory.createTextNode(value.data.toString());
          currentTarget.appendChild(dataNode);
          return dataNode;
      }
    } else if (isAttachable(value)) {
      return value.attachTo(currentTarget, domFactory);
    } else if (isViewable(value)) {
      return templateBind(value.view(), binder, currentTarget);
    } else if (typeof value === 'string') {
      const textNode = domFactory.createTextNode(value);
      currentTarget.appendChild(textNode);
      return textNode;
    } else if (typeof value === 'number') {
      const textNode = domFactory.createTextNode(String(value));
      currentTarget.appendChild(textNode);
      return textNode;
    } else {
      return resolve(initial(context, value), (initial) => {
        const textNode = domFactory.createTextNode(
          initial === undefined ? '' : String(initial)
        );
        currentTarget.appendChild(textNode);
        context.graph.valueOperator(value, {
          type: 'text',
          text: textNode,
        });
        return textNode;
      });
    }
  }

  return templateBind(rootChildren, binder, rootTarget);
}

function initial(root: RenderContext, state: Stateful) {
  if (state instanceof StateMapper) {
    const source: any = initial(root, state.source);
    if (source === undefined) {
      return undefined;
    }
    return state.mapper(source);
  }

  let context: RenderContext = root;

  while (context.parent) {
    const { scope } = context;
    if (scope.has(state)) {
      return scope.get(state);
    }

    context = context.parent;
  }

  const value = context.scope.get(state);
  if (value !== undefined) {
    return value;
  }

  return state.initial;
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';
