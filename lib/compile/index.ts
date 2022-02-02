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
import { ElementRef } from '../abstractions/element';
import { RenderTarget } from '../renderable/render-target';
import { AnchorTarget } from './anchor-target';
import { State } from '../state';
import { asTemplate } from '../jsx';

export interface RenderProps {
  items: ArrayLike<unknown>;
  start: number;
  count: number;
}

type StackItem = [TemplateNode, Template];

export function compile(rootTemplate: Template | Template[]) {
  const operationsMap = createLookup<TemplateNode, DomOperation>();

  const fragment = new DocumentFragment();
  const stack: StackItem[] = [];
  if (Array.isArray(rootTemplate)) {
    for (const tpl of rootTemplate) {
      stack.push([fragment, tpl]);
    }
  } else {
    stack.push([fragment, asTemplate(rootTemplate)]);
  }
  while (stack.length > 0) {
    const curr = stack.pop() as StackItem;
    const [target, template] = curr;

    if (Array.isArray(template)) {
      throw new Error('array unexpected!');
    }

    if (template === null || template === undefined) continue;

    switch (template.type) {
      case TemplateType.Tag:
        const { name, attrs, children } = template;
        const dom = createDOMElement('http://www.w3.org/1999/xhtml', name);
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
        const commentNode = document.createComment('');
        target.appendChild(commentNode);
        operationsMap.add(commentNode, {
          type: DomOperationType.Renderable,
          renderable: template.renderer,
        });
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
          stack.push([target, asTemplate(template.children[i])]);
        break;
      case TemplateType.ViewProvider:
        stack.push([target, template.provider.view]);
        break;
    }
  }

  return createResult();

  function compileOperations(fragment: TemplateNode) {
    const flattened = flatten(
      [createNodeCustomization(fragment, 0, operationsMap.get(fragment))],
      ({ templateNode }) =>
        toArray(templateNode.childNodes).map((n, i) =>
          createNodeCustomization(n, i, operationsMap.get(n))
        )
    );

    const customizations = new Map<TemplateNode, NodeCustomization>();
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
    node: TemplateNode,
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

    if (childNodes.length === 0) {
      return null;
    } else if (childNodes.length === 1) {
      return new CompileResult(
        // renderCustomizations.get(fragment) as NodeCustomization
        renderCustomizations.get(childNodes[0]) as NodeCustomization
      );
    } else {
      const cust = renderCustomizations.get(fragment) as NodeCustomization;
      return new CompileResult(cust);
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

export class CompileResult {
  constructor(public customization: NodeCustomization) {}

  listen(targetElement: RenderTarget) {
    addEventDelegation(targetElement, this.customization);
  }

  clone(targetElement: RenderTarget): RenderTarget {
    const { customization: cust } = this;
    const { templateNode } = cust;
    const rootNode = (templateNode as any).cloneNode(
      true,
      targetElement as any
    );

    if (templateNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const childNodes = toArray(rootNode.childNodes);
      const fragmentTarget = new FragmentTarget(targetElement, childNodes);
      for (let i = 0; i < childNodes.length; i++)
        targetElement.appendChild(childNodes[i]);
      return fragmentTarget;
    } else {
      targetElement.appendChild(rootNode);
      return rootNode;
    }
  }

  execute(targetElement: RenderTarget, values: any) {
    const { customization: cust } = this;
    const { templateNode } = cust;
    const rootNode = templateNode.cloneNode(true);

    if (templateNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const childNodes = toArray(rootNode.childNodes);
      const fragmentTarget = new FragmentTarget(targetElement, childNodes);
      for (let i = 0; i < childNodes.length; i++)
        targetElement.appendChild(childNodes[i]);
      execute(cust.render, [fragmentTarget], [values], 0, 1);
      return fragmentTarget;
    } else {
      targetElement.appendChild(rootNode as any);
      execute(cust.render, [rootNode], [values], 0, 1);
      return rootNode;
    }
  }
}

const renderStack: RenderTarget[] = [];
export function execute(
  operations: DomOperation[],
  rootNodes: RenderTarget[],
  items: ArrayLike<any>,
  offset: number,
  length: number
) {
  for (let n = 0, len = length; n < len; n = (n + 1) | 0) {
    const values = items[n];
    const rootNode = rootNodes[n + offset];
    renderStack[0] = rootNode;
    let renderIndex = 0;
    for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
      const operation = operations[n];
      // promote curr to ElementRef because we trust operation to only access valid properties
      const curr = renderStack[renderIndex] as ElementRef;
      switch (operation.type) {
        case DomOperationType.PushChild:
          renderStack[++renderIndex] = curr.childNodes[
            operation.index
          ] as HTMLElement;
          break;
        case DomOperationType.PushFirstChild:
          renderStack[++renderIndex] = curr.firstChild as HTMLElement;
          break;
        case DomOperationType.PushNextSibling:
          renderStack[++renderIndex] = curr.nextSibling as HTMLElement;
          break;
        case DomOperationType.PopNode:
          renderIndex--;
          break;
        case DomOperationType.SetTextContent:
          const textContentExpr = operation.expression;
          switch (textContentExpr.type) {
            case ExpressionType.Property:
              (curr as Node).textContent = values[textContentExpr.name];
              break;
            case ExpressionType.Function:
              const args = textContentExpr.deps.map((d) => values[d]);
              (curr as Node).textContent = textContentExpr.func.apply(
                null,
                args
              );
              break;
            case ExpressionType.State:
              textContentExpr.state.subscribe({
                next(s) {
                  (curr as Node).textContent = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetAttribute:
          const attrExpr = operation.expression;
          switch (attrExpr.type) {
            case ExpressionType.Property:
              (curr as any)[operation.name] = values[attrExpr.name];
              break;
            case ExpressionType.Function:
              const args = attrExpr.deps.map((d) => values[d]);
              (curr as any)[operation.name] = attrExpr.func.apply(null, args);
              break;
            case ExpressionType.State:
              attrExpr.state.subscribe({
                next(s) {
                  (curr as any)[operation.name] = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.AppendChild:
          (curr as Element).appendChild(operation.node);
          break;
        case DomOperationType.Renderable:
          const targetElement = new AnchorTarget(curr as Node);
          operation.renderable.render(targetElement, values);
          break;
      }
    }
  }
}

type NodeCustomization = {
  index: number;
  templateNode: TemplateNode;
  render: (DomNavigationOperation | DomRenderOperation)[];
  events: { [event: string]: (DomNavigationOperation | DomEventOperation)[] };
  updates: { [event: string]: (DomNavigationOperation | DomRenderOperation)[] };
  nodes: Node[];
};

function toArray<T extends Node>(nodes: ArrayLike<T>) {
  const result: T[] = [];
  const length = nodes.length;
  for (let i = 0; i < length; i++) {
    result.push(nodes[i]);
  }
  return result;
}

function selectMany<T, P>(
  source: (T | undefined)[],
  selector: (x: T) => (P | undefined)[]
): P[] {
  const result: P[] = [];

  for (const x of source) {
    if (x) {
      const members = selector(x);
      for (const m of members) {
        if (m) result.push(m);
      }
    }
  }

  return result;
}

function distinct<T>(source: T[]) {
  return new Set<T>(source);
}

interface TemplateNode {
  childNodes: ArrayLike<Node>;
  nodeType: Node['nodeType'];
  parentElement: Node['parentElement'];
  appendChild: Node['appendChild'];
  cloneNode(deep: boolean): RenderTarget;
}

export function addEventDelegation(
  rootContainer: RenderTarget,
  customization?: NodeCustomization
) {
  if (!customization) return;

  function getRootNode(node: Node | null): Node | null {
    if (!node) return null;
    if (rootContainer.contains(node)) return node;
    return getRootNode(node.parentNode);
  }

  for (const eventName of distinct(Object.keys(customization.events))) {
    rootContainer.addEventListener(eventName, (evt: Event) => {
      const eventName = evt.type;
      const eventTarget = evt.target as Node;

      if (!eventTarget) return;

      const operations = customization.events[eventName];
      if (!operations || !operations.length) return;

      const rootNode = getRootNode(eventTarget as Node) as HTMLElement;

      const renderStack: Node[] = [rootNode];
      let renderIndex = 0;
      for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
        const operation = operations[n];
        const curr = renderStack[renderIndex];
        switch (operation.type) {
          case DomOperationType.PushChild:
            renderStack[++renderIndex] = curr.childNodes[
              operation.index
            ] as HTMLElement;
            break;
          case DomOperationType.PushFirstChild:
            renderStack[++renderIndex] = curr.firstChild as HTMLElement;
            break;
          case DomOperationType.PushNextSibling:
            renderStack[++renderIndex] = curr.nextSibling as HTMLElement;
            break;
          case DomOperationType.PopNode:
            renderIndex--;
            break;
          case DomOperationType.AddEventListener:
            if (eventTarget === curr || curr.contains(eventTarget)) {
              operation.handler({ node: rootNode, event: evt });
            }
            break;
        }
      }
    });
  }
}

class FragmentTarget implements RenderTarget {
  constructor(
    private parentElement: RenderTarget,
    public childNodes: ArrayLike<Node>
  ) {}

  get firstChild() {
    return this.childNodes[0];
  }

  get nextSibling() {
    const { childNodes } = this;
    const lastIndex = childNodes.length - 1;
    return this.childNodes[lastIndex].nextSibling;
  }
  removeChild(node: Node): void {
    this.parentElement.removeChild(node);
  }
  appendChild(node: Node): void {
    this.parentElement.appendChild(node);
  }
  addEventListener(type: string, handler: (evt: Event) => void): void {
    this.parentElement.addEventListener(type, handler);
  }
  insertBefore<T extends Node>(node: T, child: Node | null): T {
    return this.parentElement.insertBefore(node, child);
  }

  contains(node: Node | null) {
    if (!node) return false;
    const { childNodes } = this;
    for (let i = 0, len = childNodes.length; i < len; i++) {
      if (childNodes[i] === node) return true;
    }
    return false;
  }
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
