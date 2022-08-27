import { AttributeType, TemplateType, Template, Renderable, RenderTarget, View, ExpressionType } from '../jsx';
import flatten from '../util/flatten';
import {
  DomEventOperation,
  DomNavigationOperation,
  DomOperation,
  DomOperationType,
  DomRenderOperation,
} from './dom-operation';
import { createLookup } from '../util/lookup';
import { isSubscribable, isUnsubscribable } from '../util/is-subscibable';
import { createDOMElement } from '../util/create-dom';
import { State } from '../state';
import { distinct, selectMany, toArray } from '../util/helpers';
import { CompileResult, NodeCustomization } from './compile-result';

export interface RenderProps {
  items: ArrayLike<unknown>;
  start: number;
  count: number;
}

type StackItem = [Node, Template];

export function compile(rootTemplate: Template | CompileResult) {
  if (rootTemplate instanceof CompileResult) return rootTemplate;

  const operationsMap = createLookup<Node, DomOperation>();

  const fragment = new DocumentFragment();
  operationsMap.add(fragment, {
    type: DomOperationType.SelectNode,
  });

  const stack: StackItem[] = [];
  if (rootTemplate instanceof Array) {
    for (const tpl of rootTemplate) {
      stack.push([fragment, tpl]);
    }
  } else {
    stack.push([fragment, asTemplate(rootTemplate)]);
  }
  while (stack.length > 0) {
    const curr = stack.pop() as StackItem;
    const [target, template] = curr;

    if (template instanceof Array) {
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
            } else if (attr.type === AttributeType.ClassName) {
              setClassName(dom, attr.value);
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
          stack.push([dom, asTemplate(children[length])]);
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
        operationsMap.add(target, {
          type: DomOperationType.Renderable,
          renderable: template.renderer,
        });
        break;
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
          stack.push([target, asTemplate(template.children[i])]);
        break;
      case TemplateType.ViewProvider:
        const { view } = template.provider;
        stack.push([target, asTemplate(view)]);
        break;
    }
  }

  return createResult();

  function compileOperations(root: Node) {
    const rootOperations = operationsMap.get(root) || [];

    const flattened = flatten(
      [createNodeCustomization(root, 0, rootOperations)],
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
          case DomOperationType.SetClassName:
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
      dom: Symbol(index),
      templateNode: node,
      index,
      render,
      events,
      updates,
    };
  }

  function createResult(): CompileResult | null {
    const { childNodes } = fragment;

    const nodesLength = childNodes.length;
    if (nodesLength === 0) return null;

    const childCustomizations: NodeCustomization[] = new Array(nodesLength);
    for (let i = 0; i < nodesLength; i++) {
      const childNode = childNodes[i];
      const renderCustomizations = compileOperations(childNode).get(
        childNode
      ) as NodeCustomization;
      childCustomizations[i] = renderCustomizations;

      const { updates } = renderCustomizations;
      for (const property in renderCustomizations.updates) {
        updates[property].unshift({
          type: DomOperationType.SelectNode,
        });
      }
    }

    return new CompileResult(childCustomizations);
  }

  function setClassName(elt: Element, value: any) {
    if (!value) return;

    if (value.type === TemplateType.Expression) {
      operationsMap.add(elt, {
        type: DomOperationType.SetClassName,
        expression: value.expression,
      });
    } else if (value instanceof State) {
      if (value.current) elt.classList.add(value.current);
      operationsMap.add(elt, {
        type: DomOperationType.SetClassName,
        expression: {
          type: ExpressionType.State,
          state: value,
        },
      });
    } else if (value instanceof Function) {
      const func = value;
      operationsMap.add(elt, {
        type: DomOperationType.Renderable,
        renderable: {
          render(_: RenderTarget, args: any) {
            const value = func(args);

            if (isSubscribable(value)) {
              //   bind(target, value);
              // } else {
              //   target.classList.add(value);
            }

            return {
              dispose() {},
            };
          },
        },
      });
    } else {
      for (const cl of value.split(' ')) elt.classList.add(cl);
    }

    // function bind(target: Element, subscribable: RXJS.Subscribable<any>) {
    //   const subscr = subscribable.subscribe({
    //     next(value: any) {
    //       target.classList.add(value);
    //     },
    //   });

    //   return {
    //     dispose() {
    //       subscr.unsubscribe();
    //     },
    //   };
    // }
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
    } else if (value instanceof Function) {
      const func = value;
      operationsMap.add(elt, {
        type: DomOperationType.Renderable,
        renderable: {
          render(_: Element, args: any) {
            const value = func(args);

            if (isSubscribable(value)) {
              //   bind(target, value);
              // } else {
              //   target.setAttribute(name, value);
            }
            return { dispose() {} };
          },
        },
      });
    } else {
      elt.setAttribute(name, value);
    }

    // function bind(target: Element, subscribable: RXJS.Subscribable<any>) {
    //   const subscr = subscribable.subscribe({
    //     next(value: any) {
    //       target.setAttribute(name, value);
    //     },
    //   });

    //   return {
    //     dispose() {
    //       subscr.unsubscribe();
    //     },
    //   };
    // }
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

export function asTemplate(value: any): Template {
  if (typeof value === 'undefined' || value === null) {
    return null as any;
  } else if (isTemplate(value)) return value;
  // else if (isComponent(name)) return new TemplateComponent(name);
  // else if (isAttachable(name)) return new TemplateAttachable(name);
  // else if (typeof name === 'function') return name;
  // else if (Array.isArray(name)) return flatTree(name, asTemplate);
  // else if (isPromise<TemplateInput>(name)) return new TemplatePromise(name);
  else if (value instanceof View<any>) {
    return {
      type: TemplateType.Renderable,
      renderer: value,
    };
  } else if (value instanceof State) {
    return {
      type: TemplateType.State,
      state: value,
    };
  } else if (isUnsubscribable(value))
    return {
      type: TemplateType.Disposable,
      dispose() {
        value.unsubscribe();
      },
    };
  else if (isDomNode(value))
    return {
      type: TemplateType.DOM,
      node: value,
    };
  else if (
    'view' in Object.keys(value) ||
    'view' in value.constructor.prototype
  ) {
    return {
      type: TemplateType.ViewProvider,
      provider: value,
    };
  } else if (isRenderable(value)) {
    return {
      type: TemplateType.Renderable,
      renderer: value,
    };
  } else if (typeof value === 'function') {
    return {
      type: TemplateType.Renderable,
      renderer: {
        render: value,
      },
    };
  }
  // else if (hasProperty(name, 'view')) return asTemplate(name.view);
  // else if (isPrimitive(name)) return new PrimitiveTemplate(name);

  // return new NativeTemplate(name);
  return {
    type: TemplateType.Text,
    value,
  };
}

function isRenderable(value: any): value is Renderable {
  return value && typeof value.render === 'function';
}

function isTemplate(value: any): value is Template {
  if (!value) return false;
  const { type } = value;
  return type === 0 || !isNaN(parseInt(type));
}

function isDomNode(obj: any): obj is Node {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement;
  } catch (e) {
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (
      typeof obj === 'object' &&
      obj.nodeType === 1 &&
      typeof obj.style === 'object' &&
      typeof obj.ownerDocument === 'object'
    );
  }
}
