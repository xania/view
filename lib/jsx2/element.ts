import { isSubscribable } from '../util/is-subscibable';
import {
  AddEventListenerOperation,
  DomNavigationOperation,
  DomOperationType,
  DomRenderOperation,
  SetAttributeOperation,
  SetClassNameOperation,
  SetTextContentOperation,
  UpdateAttributeOperation,
  UpdateContentOperation,
} from '../compile/dom-operation';
import { JsxFactoryOptions } from '../jsx/options';
import { flatten } from './_flatten';
import { ExpressionType } from '../jsx/expression';
import { TemplateInput } from './template-input';
import { isRenderable, RenderTarget } from '../jsx/renderable';
import { isExpression } from '../jsx/expression';
import { disposeAll } from '../disposable';
import { execute, ExecuteContext } from './execute';

export class JsxElement {
  public templateNode: HTMLElement;
  public content: DomContentOperation[] = [];
  public updates: DomUpdateOperation[] = [];

  constructor(public name: string) {
    this.templateNode = document.createElement(name);
  }

  setProp(
    attrName: string,
    attrValue: any,
    classes?: JsxFactoryOptions['classes']
  ): Promise<void> | void {
    if (attrValue === null || attrValue === undefined) return;

    if (attrValue instanceof Promise) {
      return attrValue.then((v) => this.setProp(attrName, v, classes));
    }

    const { templateNode: node } = this;

    if (('on' + attrName).toLocaleLowerCase() in HTMLElement.prototype) {
      if (attrValue instanceof Function) {
        this.content.push({
          type: DomOperationType.AddEventListener,
          name: attrName,
          handler: attrValue,
        });
      }
    } else if (attrName === 'class') {
      for (const item of flatten(attrValue)) {
        if (typeof item === 'string')
          for (const cls of item.split(' ')) {
            if (cls) node.classList.add((classes && classes[cls]) || cls);
          }
        else if (isSubscribable(item)) {
          this.content.push({
            type: DomOperationType.SetClassName,
            expression: {
              type: ExpressionType.State,
              state: item,
            },
            classes,
          });
        } else if (isExpression(item)) {
          this.content.push({
            type: DomOperationType.SetClassName,
            expression: item,
            classes,
          });
        }
      }
    } else if (isSubscribable(attrValue)) {
      this.content.push({
        type: DomOperationType.SetAttribute,
        name: attrName,
        expression: {
          type: ExpressionType.State,
          state: attrValue,
        },
      });
    } else if (isExpression(attrValue)) {
      if (attrValue.type === ExpressionType.Property) {
        this.updates.push({
          type: DomOperationType.UpdateAttribute,
          property: attrValue.name,
          name: attrName,
        });
      }
      this.content.push({
        type: DomOperationType.SetAttribute,
        name: attrName,
        expression: attrValue,
      });
    } else {
      (node as any)[attrName] = attrValue;
      // node.setAttribute(attrName, attrValue);
    }
  }

  appendContent(children: TemplateInput[]): Promise<void>[] | void {
    if (!(children instanceof Array)) return;

    const result: Promise<void>[] = [];

    const { templateNode } = this;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof JsxElement) {
        this.appendElement(child);
      } else if (child instanceof Promise) {
        const nextChildren = children.slice(i + 1);
        result.push(
          child.then((resolved: any) => {
            this.appendContent([resolved, ...nextChildren]);
          })
        );
      } else if (isRenderable(child)) {
        this.content.push({
          type: DomOperationType.Renderable,
          renderable: child,
        });
      } else if (isSubscribable(child)) {
        this.content.push({
          type: DomOperationType.AppendContent,
          expression: {
            type: ExpressionType.State,
            state: child,
          },
        });
      } else if (isExpression(child)) {
        if (child.type === ExpressionType.Property)
          this.updates.push({
            type: DomOperationType.UpdateContent,
            property: child.name,
          });
        this.content.push({
          type: DomOperationType.AppendContent,
          expression: child,
        });
      } else if (child instanceof Node) {
        templateNode.appendChild(child);
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

    return result;
  }

  appendElement(tag: JsxElement) {
    const { templateNode: node } = this;
    if (tag.content.length > 0) {
      this.content.push({
        type: DomOperationType.PushChild,
        index: node.childNodes.length,
      });
      for (const op of tag.content) {
        this.content.push(op);
      }
      this.content.push({
        type: DomOperationType.PopNode,
      });
    }
    if (tag.updates.length > 0) {
      this.updates.push({
        type: DomOperationType.PushChild,
        index: node.childNodes.length,
      });
      for (const op of tag.updates) {
        this.updates.push(op);
      }
      this.updates.push({
        type: DomOperationType.PopNode,
      });
    }
    this.templateNode.appendChild(tag.templateNode);
  }

  // listen(target: RenderTarget, root: HTMLElement, context: ExecuteContext) {
  //   if (this.events.length) {
  //     execute(this.events, root, context);
  //   }
  //   // target.addEventListener(eventName, function handler(event: Event) {
  //   //   let closest = event.target as HTMLElement | null;
  //   //   const { handlers } = context;
  //   //   while (closest) {
  //   //     for (const [node, handler] of handlers) {
  //   //       if (node === closest) {
  //   //         handler({ node: closest });
  //   //       }
  //   //     }
  //   //     if (target instanceof Node) {
  //   //       if (target === closest.parentElement) break;
  //   //     } else {
  //   //       for (const i in target.childNodes) {
  //   //         if (target.childNodes[i] === closest) break;
  //   //       }
  //   //     }
  //   //     closest = closest.parentElement;
  //   //   }
  //   // });
  // }

  render(target: RenderTarget) {
    const root = this.templateNode.cloneNode(true) as HTMLElement;
    const bindings: ExecuteContext['bindings'] = [];
    const subscriptions: ExecuteContext['subscriptions'] = [];

    execute(this.content, root, {
      bindings,
      subscriptions,
      handlers: createEventManager(target),
      values: null,
    });
    target.appendChild(root);

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

type DomContentOperation =
  | DomNavigationOperation
  | SetTextContentOperation
  | DomRenderOperation
  | DomNavigationOperation
  | SetAttributeOperation
  | SetClassNameOperation
  | AddEventListenerOperation;

type DomUpdateOperation =
  | DomNavigationOperation
  | UpdateContentOperation
  | UpdateAttributeOperation;

export interface EventContext {
  node: Node;
  values?: any;
}

export function createEventManager(target: RenderTarget) {
  const events: { [k: string]: EventContext[] } = {};
  return {
    push(node: Node, name: string, handler: Function, values?: any) {
      if (name === 'blur') {
        node.addEventListener(name, function (event: Event) {
          handler({ node, values, event });
        });
      } else if (name in events) {
        events[name].push({ node, values });
      } else {
        events[name] = [{ node, values }];
        target.addEventListener(name, function (event: Event) {
          let closest = event.target as HTMLElement | null;
          const nodes = events[event.type];
          while (closest) {
            for (const ctx of nodes) {
              if (ctx.node === closest) {
                handler({ ...ctx, event });
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
    },
  };
}
