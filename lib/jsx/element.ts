import {
  AddEventListenerOperation,
  DomNavigationOperation,
  DomOperation,
  DomOperationType,
  DomRenderOperation,
  SetAttributeOperation,
  SetClassNameOperation,
  SetTextContentOperation,
} from '../render/dom-operation';
import { JsxFactoryOptions } from './factory';
import { flatten } from './_flatten';
import { ExpressionType } from './expression';
import { TemplateInput } from './template-input';
import { isRenderable, RenderTarget } from './renderable';
import { Disposable, disposeAll } from '../disposable';
import { execute, ExecuteContext } from '../render/execute';
import { State } from '../state';
import { isSubscribable } from '../util/observables';
import { isTemplate, TemplateType } from './template';

export class JsxElement {
  public templateNode: HTMLElement;
  public content: DomContentOperation<any>[] = [];
  public updates: DomUpdateOperation[] = [];

  constructor(public name: string) {
    this.templateNode = document.createElement(name);
  }

  setProp(
    attrName: string,
    attrValue: any,
    options?: JsxFactoryOptions
  ): Promise<void> | void {
    if (attrValue === null || attrValue === undefined) return;

    if (attrValue instanceof Promise) {
      return attrValue.then((v) => this.setProp(attrName, v, options));
    }

    const { templateNode: node } = this;

    if (('on' + attrName).toLocaleLowerCase() in HTMLElement.prototype) {
      if (attrValue instanceof Function) {
        this.content.push({
          key: Symbol(),
          type: DomOperationType.AddEventListener,
          name: attrName,
          handler: attrValue,
        });
      }
    } else if (attrName === 'class') {
      for (const item of flatten(attrValue)) {
        if (item instanceof Function) {
          this.content.push({
            key: Symbol(),
            type: DomOperationType.SetClassName,
            expression: {
              type: ExpressionType.Init,
              init: item as any,
            },
            classes: options?.classes,
          });
        } else if (typeof item === 'string') {
          const classes = options?.classes;
          for (const cls of item.split(' ')) {
            if (cls) node.classList.add((classes && classes[cls]) || cls);
          }
        } else if (isSubscribable(item)) {
          this.content.push({
            key: Symbol(),
            type: DomOperationType.SetClassName,
            expression: {
              type: ExpressionType.State,
              state: item,
            },
            classes: options?.classes,
          });
        } else if (item instanceof State) {
          this.content.push({
            key: Symbol(),
            type: DomOperationType.SetClassName,
            expression: {
              type: ExpressionType.State,
              state: item,
            },
            classes: options?.classes,
          });
        } else if (isTemplate(item)) {
          switch (item.type) {
            case TemplateType.Expression:
              const op: DomUpdateOperation = {
                key: Symbol(),
                type: DomOperationType.SetClassName,
                expression: item.expr,
                classes: options?.classes,
              };
              this.content.push(op);
              if (item.expr.type === ExpressionType.Property)
                this.updates.push(op);
              break;
          }
        }
      }
    } else if (isSubscribable(attrValue)) {
      this.content.push({
        key: Symbol(),
        type: DomOperationType.SetAttribute,
        name: attrName,
        expression: {
          type: ExpressionType.State,
          state: attrValue,
        },
      });
    } else if (isTemplate(attrValue)) {
      switch (attrValue.type) {
        case TemplateType.Expression:
          this.content.push({
            key: Symbol(),
            type: DomOperationType.SetAttribute,
            name: attrName,
            expression: attrValue.expr,
          });
          break;
      }
    } else {
      (node as any)[attrName] = attrValue;
    }
  }

  appendContent(children: TemplateInput[]): Promise<void> | void {
    if (!(children instanceof Array)) return;

    const { templateNode } = this;
    const createTextNodes =
      children.length > 0 || templateNode.childNodes.length > 0;

    const addTextContentExpr = (
      expr: JSX.Expression,
      operations: DomOperation<any>[],
      createNode: boolean = true
    ) => {
      if (createTextNodes) {
        const textNodeIndex = templateNode.childNodes.length;
        if (createNode) {
          const textNode = document.createTextNode('');
          templateNode.appendChild(textNode);
        }
        operations.push({
          key: Symbol(),
          type: DomOperationType.SetTextContent,
          expression: expr,
          textNodeIndex: textNodeIndex,
        });
      } else {
        operations.push({
          key: Symbol(),
          type: DomOperationType.SetTextContent,
          expression: expr,
        });
      }
    };

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (child instanceof JsxElement) {
        this.appendElement(child);
      } else if (child instanceof Promise) {
        const nextChildren = children.slice(i + 1);
        return child.then((resolved: any) => {
          this.appendContent([resolved, ...nextChildren]);
        });
      } else if (child instanceof State) {
        addTextContentExpr(
          {
            type: ExpressionType.State,
            state: child,
          },
          this.content
        );
      } else if (child instanceof Node) {
        templateNode.appendChild(child);
      } else if ((child as any)['attachTo'] instanceof Function) {
        this.content.push({
          key: Symbol(),
          type: DomOperationType.Renderable,
          renderable: {
            child: child as { attachTo: Function },
            render(elt: HTMLElement) {
              this.child.attachTo(elt);
              return {
                dispose() {},
              };
            },
          },
        });
      } else if (child instanceof Function) {
        addTextContentExpr(
          {
            type: ExpressionType.Init,
            init: child as any,
          },
          this.content
        );
      } else if (isRenderable(child)) {
        this.content.push({
          key: Symbol(),
          type: DomOperationType.Renderable,
          renderable: child,
        });
      } else if (isTemplate(child)) {
        switch (child.type) {
          case TemplateType.Expression:
            if (child.expr.type === ExpressionType.Property) {
              addTextContentExpr(child.expr, this.updates, false);
            }
            addTextContentExpr(child.expr, this.content);
            break;
          case TemplateType.Attribute:
            const result = this.setProp(child.name, child.value, child.options);
            if (result instanceof Promise) {
              const nextChildren = children.slice(i + 1);
              return result.then(() => {
                this.appendContent(nextChildren);
              });
            }
            break;
        }
      } else if (isSubscribable(child)) {
        addTextContentExpr(
          {
            type: ExpressionType.State,
            state: child,
          },
          this.content
        );
      } else {
        if (
          templateNode.textContent ||
          templateNode.childNodes.length ||
          this.content.length
        ) {
          const textNode = document.createTextNode(child as any);
          templateNode.appendChild(textNode);
        } else {
          templateNode.textContent = child as any;
        }
      }
    }
  }

  appendElement(tag: JsxElement) {
    const { templateNode: node } = this;
    if (tag.content.length > 0) {
      this.content.push({
        key: Symbol(),
        type: DomOperationType.PushChild,
        index: node.childNodes.length,
      });
      for (const op of tag.content) {
        this.content.push(op);
      }
      this.content.push({
        key: Symbol(),
        type: DomOperationType.PopNode,
      });
    }
    if (tag.updates.length > 0) {
      this.updates.push({
        key: Symbol(),
        type: DomOperationType.PushChild,
        index: node.childNodes.length,
      });
      for (const op of tag.updates) {
        this.updates.push(op);
      }
      this.updates.push({
        key: Symbol(),
        type: DomOperationType.PopNode,
      });
    }

    this.templateNode.appendChild(tag.templateNode);
  }

  render(target: RenderTarget) {
    const root = this.templateNode.cloneNode(true) as HTMLElement;
    const bindings: ExecuteContext['bindings'] = [];
    const subscriptions: ExecuteContext['subscriptions'] = [];

    target.appendChild(root);
    execute(this.content, root, createExecuteContext(target, null));

    return {
      dispose() {
        disposeAll(bindings);
        root.remove();
        for (const sub of subscriptions) {
          sub.unsubscribe();
        }
      },
    };
  }
}

type DomUpdateOperation =
  | DomNavigationOperation
  | SetTextContentOperation
  | SetClassNameOperation;

type DomContentOperation<T> =
  | DomNavigationOperation
  | SetTextContentOperation
  | DomRenderOperation<T>
  | DomNavigationOperation
  | SetAttributeOperation
  | SetClassNameOperation
  | AddEventListenerOperation;

export interface EventContext<T, TEvent> extends JSX.EventContext<T, TEvent> {}

export function createExecuteContext<T>(target: RenderTarget, values?: T) {
  const bindings: Disposable[] = [];
  const subscriptions: JSX.Unsubscribable[] = [];
  const elements: Node[] = [];

  return {
    bindings,
    subscriptions,
    elements,
    data: new State(values),
    push: createEventHandler(target),
  } as ExecuteContext<T>;
}

export function createEventHandler(target: RenderTarget) {
  const events: {
    [k: string]: {
      context: ExecuteContext<any>;
      node: Node;
      handler: (evnt: EventContext<any, any>) => any;
    }[];
  } = {};

  return function pushHandler<T>(
    this: ExecuteContext<T>,
    node: Node,
    name: string,
    handler: (evnt: EventContext<T, any>) => any
  ) {
    const context = this;
    if (name === 'blur') {
      node.addEventListener(name, function (event: Event) {
        handler({
          node,
          event,
          data: context.data,
        });
      });
    } else if (name in events) {
      events[name].push({ context, node, handler });
    } else {
      events[name] = [{ context, node, handler }];
      target.addEventListener(name, function (event: Event) {
        let closest = event.target as HTMLElement | null;
        const nodes = events[event.type];
        while (closest) {
          for (const pair of nodes) {
            if (pair.node === closest) {
              pair.handler({
                node: closest,
                data: pair.context.data,
                event,
              });
            }
          }
          if (target instanceof Node) {
            if (target === closest.parentElement) break;
          } else {
            for (const i in target.childNodes) {
              if (target.childNodes[i] === closest) break;
            }
          }
          closest = closest.parentElement;
        }
      });
    }
  };
}
