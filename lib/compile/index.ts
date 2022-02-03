import { AttributeType, TemplateType, Template } from '../template';
import { ExpressionType } from '../expression';
import flatten from '../util/flatten';
import {
  DomEventOperation,
  DomNavigationOperation,
  DomOperation,
  DomOperationType,
  DomRenderOperation,
} from './dom-operation';
import { createLookup } from '../util/lookup';
import { isSubscribable } from '../util/is-subscibable';
import { createDOMElement } from '../util/create-dom';
import { State } from '../state';
import { asTemplate } from '../jsx';
import {
  CompileResult,
  FragmentCompileResult,
  NodeCompileResult,
} from './compile-result';
import { distinct, NodeCustomization, selectMany, toArray } from './helpers';

export interface RenderProps {
  items: ArrayLike<unknown>;
  start: number;
  count: number;
}

type StackItem = [Node, Template, Template[]];

export function compile(rootTemplate: Template | Template[]) {
  const operationsMap = createLookup<Node, DomOperation>();

  const fragment = new DocumentFragment();
  const stack: StackItem[] = [];
  if (Array.isArray(rootTemplate)) {
    for (const tpl of rootTemplate) {
      stack.push([fragment, tpl, rootTemplate]);
    }
  } else {
    stack.push([fragment, asTemplate(rootTemplate), [rootTemplate]]);
  }
  while (stack.length > 0) {
    const curr = stack.pop() as StackItem;
    const [target, template, siblings] = curr;

    if (Array.isArray(template)) {
      throw new Error('array unexpected!');
    }

    if (template === null || template === undefined) continue;

    switch (template.type) {
      case TemplateType.Tag:
        const { name, attrs, children } = template;
        const dom = createDOMElement(name);
        target.appendChild(dom);

        if (attrs) {
          for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (attr.type === AttributeType.Attribute) {
              setAttribute(dom, attr.name, attr.value);
            } else if (attr.type === AttributeType.Event) {
              operationsMap.add(dom, {
                type: DomOperationType.AddEventListener,
                name: attr.event,
                handler: attr.handler,
              });
            }
          }
        }

        let { length } = children;
        while (length--) {
          stack.push([dom, asTemplate(children[length]), children]);
        }
        break;
      case TemplateType.Text:
        const textNode = document.createTextNode(template.value);
        target.appendChild(textNode);
        break;
      case TemplateType.State:
        const state = template.state;
        const stateNode = document.createTextNode(state.current);
        target.appendChild(stateNode);
        operationsMap.add(stateNode, {
          type: DomOperationType.SetTextContent,
          expression: {
            type: ExpressionType.State,
            state,
          },
        });
        break;
      case TemplateType.DOM:
        operationsMap.add(target, {
          type: DomOperationType.AppendChild,
          node: template.node,
        });
        break;
      case TemplateType.Renderable:
        const operation: DomOperation = {
          type: DomOperationType.Renderable,
          renderable: template.renderer,
        };

        if (siblings?.length === 1) {
          operationsMap.add(target, operation);
        } else {
          const commentNode = document.createComment('');
          target.appendChild(commentNode);
          operationsMap.add(commentNode, operation);
        }
        break;
      // case TemplateType.Subscribable:
      //   const asyncNode = document.createTextNode('');
      //   target.appendChild(asyncNode);
      //   operationsMap.add(asyncNode, {
      //     type: DomOperationType.Renderable,
      //     renderable: {
      //       render(target) {
      //         const subscr = template.value.subscribe({
      //           next(x) {
      //             target.textContent = x;
      //           },
      //         });
      //         return RenderResult.create(null, subscr);
      //       },
      //     },
      //   });
      //   break;
      // case TemplateType.Context:
      //   const contextNode = document.createTextNode('');
      //   target.appendChild(contextNode);
      //   operationsMap.add(target, {
      //     type: DomOperationType.Renderable,
      //     renderable: createFunctionRenderer(template.func),
      //   });
      //   break;
      case TemplateType.Expression:
        const exprNode = document.createTextNode('');
        target.appendChild(exprNode);

        operationsMap.add(exprNode, {
          type: DomOperationType.SetTextContent,
          expression: template.expression,
        });
        break;
      case TemplateType.Fragment:
        for (let i = template.children.length; i--; )
          stack.push([target, asTemplate(template.children[i]), children]);
        break;
      case TemplateType.ViewProvider:
        const { view } = template.provider;
        stack.push([target, view, []]);
        break;
    }
  }

  return createResult();

  function compileOperations(fragment: Node) {
    const flattened = flatten(
      [createNodeCustomization(fragment, 0, operationsMap.get(fragment))],
      ({ templateNode }) =>
        toArray(templateNode.childNodes).map((n, i) =>
          createNodeCustomization(n, i, operationsMap.get(n))
        )
    );

    const customizations = new Map<Node, NodeCustomization>();
    // iterate in reverse to traverse nodes bottom up
    for (let i = flattened.length - 1; i >= 0; i--) {
      const cust = flattened[i];

      const children = toArray(cust.templateNode.childNodes)
        .map((node) => customizations.get(node))
        .filter((x) => !!x) as NodeCustomization[];

      customizations.set(cust.templateNode, cust);

      iter(cust, (x) => x.render);
      const eventNames = distinct(
        selectMany(children, (child) => Object.keys(child.events))
      );
      for (const eventName of eventNames) {
        if (!cust.events[eventName]) {
          cust.events[eventName] = [];
        }
        iter(cust, (x) => x.events[eventName]);
      }
      const placeholderNames = distinct(
        selectMany(children, (child) => Object.keys(child.updates))
      );
      for (const name of placeholderNames) {
        if (!cust.updates[name]) {
          cust.updates[name] = [];
        }
        iter(cust, (x) => x.updates[name]);
      }

      function iter(
        cust: NodeCustomization,
        getOperations: (
          node: NodeCustomization
        ) => (DomOperation | DomNavigationOperation)[]
      ) {
        const operations = getOperations(cust);
        if (children.length || operations.length) {
          if (
            children.length === 1 &&
            children[0].templateNode.nodeType === Node.TEXT_NODE
          ) {
            const childOperations = getOperations(children[0]);
            if (
              childOperations &&
              childOperations.length === 1 &&
              childOperations[0].type === DomOperationType.SetTextContent
            ) {
              const child = children[0];
              const { parentElement } = child.templateNode;
              if (parentElement) {
                parentElement?.removeChild(child.templateNode as Node);
                operations.push(childOperations[0]);
                return;
              }
            }
          }

          let prevIndex = -1;

          for (const child of children) {
            const childOperations = getOperations(child);
            if (childOperations?.length) {
              const { index } = child;
              if (index === 0) {
                operations.push({
                  type: DomOperationType.PushFirstChild,
                });
              } else if (index === prevIndex + 1) {
                operations.pop();
                operations.push({
                  type: DomOperationType.PushNextSibling,
                });
              } else {
                operations.push({
                  type: DomOperationType.PushChild,
                  index,
                });
              }
              operations.push(...childOperations);
              operations.push({ type: DomOperationType.PopNode });
              prevIndex = index;
            }
          }
        }
      }
    }

    return customizations;
  }

  function createNodeCustomization(
    node: Node,
    index: number,
    operations?: DomOperation[]
  ): NodeCustomization {
    const render: DomRenderOperation[] = [];
    const events: { [event: string]: DomEventOperation[] } = {};
    const updates: {
      [prop: string | number | symbol]: DomRenderOperation[];
    } = {};

    if (operations)
      for (const op of operations) {
        switch (op.type) {
          case DomOperationType.SetAttribute:
          case DomOperationType.SetTextContent:
            if (op.expression.type === ExpressionType.Property) {
              const name = op.expression.name;
              const updatesBag = updates[name] || (updates[name] = []);
              updatesBag.push(op);
            } else if (op.expression.type === ExpressionType.Function) {
              const { deps } = op.expression;
              for (const name of deps) {
                const updatesBag = updates[name] || (updates[name] = []);
                updatesBag.push(op);
              }
            }
            render.push(op);
            break;
          case DomOperationType.AppendChild:
            render.push(op);
            break;
          case DomOperationType.Renderable:
            render.push(op);
            break;
          case DomOperationType.AddEventListener:
            const { name } = op;
            const eventBag = events[name] || (events[name] = []);
            eventBag.push(op);
            break;
        }
      }
    return {
      templateNode: node,
      index,
      render,
      events,
      updates,
      nodes: [],
    };
  }

  function createResult() {
    const { childNodes } = fragment;
    const renderCustomizations = compileOperations(fragment);

    const childCustomizations: NodeCustomization[] = new Array(
      childNodes.length
    );
    for (let i = 0, len = childNodes.length; i < len; i++) {
      const childNode = childNodes[i];
      childCustomizations[i] = renderCustomizations.get(
        childNode
      ) as NodeCustomization;
    }
    if (operationsMap.get(fragment)?.length || childNodes.length !== 1) {
      const fragmentCustomization = renderCustomizations.get(fragment);
      return new FragmentCompileResult(
        fragmentCustomization,
        childCustomizations
      );
    } else if (childNodes.length === 1) {
      return new NodeCompileResult(
        renderCustomizations.get(childNodes[0]) as NodeCustomization
      );
    } else {
      return null;
    }
  }

  function setAttribute(elt: Element, name: string, value: any): void {
    if (!value) return;

    if (value.type === TemplateType.Expression) {
      operationsMap.add(elt, {
        type: DomOperationType.SetAttribute,
        name,
        expression: value.expression,
      });
    } else if (value instanceof State) {
      if (value.current) elt.setAttribute(name, value.current);
      operationsMap.add(elt, {
        type: DomOperationType.SetAttribute,
        name,
        expression: {
          type: ExpressionType.State,
          state: value,
        },
      });
    } else if (isSubscribable(value)) {
      operationsMap.add(elt, {
        type: DomOperationType.Renderable,
        renderable: {
          render(target: Element) {
            bind(target, value);
          },
        },
      });
    } else if (typeof value === 'function') {
      const func = value;
      operationsMap.add(elt, {
        type: DomOperationType.Renderable,
        renderable: {
          render(target: Element, args: any) {
            const value = func(args);

            if (isSubscribable(value)) {
              bind(target, value);
            } else {
              target.setAttribute(name, value);
            }
          },
        },
      });
    } else {
      elt.setAttribute(name, value);
    }

    function bind(target: Element, subscribable: RXJS.Subscribable<any>) {
      const subscr = subscribable.subscribe({
        next(value: any) {
          target.setAttribute(name, value);
        },
      });

      return {
        dispose() {
          subscr.unsubscribe();
        },
      };
    }
  }
}

export interface RenderOptions {
  items: ArrayLike<any>;
  start: number;
  count: number;
}

// class FragmentTemplate {
//   constructor(
//     private parentElement: RenderTarget,
//     private childNodes: ArrayLike<Node>
//   ) {}

//   cloneNode(deep: boolean = false) {
//     const { childNodes } = this;
//     const { length } = childNodes;
//     const cloneNodes = new Array(length);
//     for (let i = 0; i < length; i++) {
//       cloneNodes[i] = childNodes[i].cloneNode(deep);
//     }
//     return new FragmentTarget(this.parentElement, cloneNodes);
//   }
// }
