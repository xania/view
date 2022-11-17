import { isSubscribable } from '../util/is-subscibable';
import {
  AddEventListenerOperation,
  DomNavigationOperation,
  DomOperationType,
  DomRenderOperation,
  SetAttributeOperation,
  SetClassNameOperation,
  SetTextContentOperation,
} from '../compile/dom-operation';
import { JsxFactoryOptions } from '../jsx/options';
import { flatten } from './_flatten';
import { ExpressionType } from '../jsx/expression';
import { TemplateInput } from './template-input';
import { isRenderable, RenderTarget } from '../jsx/renderable';
import { isExpressionTemplate } from '../jsx/template';
import { disposeAll } from '../disposable';
import { execute, ExecuteContext } from './execute';

export class JsxElement {
  public templateNode: HTMLElement;
  public events: { [name: string]: DomEventOperation[] } = {};
  public eventTargets: { [name: string]: DomEventOperation[] } = {};
  public content: DomContentOperation[] = [];

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
        const eventOperations =
          this.eventTargets[attrName] ?? (this.events[attrName] = []);
        eventOperations.push({
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
            expressions: [
              {
                type: ExpressionType.State,
                state: item,
              },
            ],
            classes,
          });
        }
      }
    } else {
      node.setAttribute(attrName, attrValue);
    }
  }

  appendTemplates(children: TemplateInput[]): Promise<void>[] | void {
    if (!(children instanceof Array)) return;

    const result: Promise<void>[] = [];

    const { templateNode: node } = this;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof JsxElement) {
        this.appendElement(child);
      } else if (child instanceof Promise) {
        const nextChildren = children.slice(i + 1);
        result.push(
          child.then((resolved: any) => {
            this.appendTemplates([resolved, ...nextChildren]);
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
      } else if (isExpressionTemplate(child)) {
        this.content.push({
          type: DomOperationType.AppendContent,
          expression: child.expression,
        });
      } else {
        if (node.textContent || node.childNodes.length) {
          const textNode = document.createTextNode(child as any);
          node.appendChild(textNode);
        } else {
          node.textContent = child as any;
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
    for (const eventName in tag.events) {
      const childEventOperations = tag.events[eventName];
      if (childEventOperations.length > 0) {
        const eventOperations =
          this.events[eventName] ?? (this.events[eventName] = []);

        eventOperations.push({
          type: DomOperationType.PushChild,
          index: node.childNodes.length,
        });
        for (const op of childEventOperations) {
          eventOperations.push(op);
        }
        eventOperations.push({
          type: DomOperationType.PopNode,
        });
      }
    }
    this.templateNode.appendChild(tag.templateNode);
  }

  listen(target: RenderTarget, root: HTMLElement, context: ExecuteContext) {
    const events = this.events;
    const eventNames = Object.keys(events);

    for (const eventName of eventNames) {
      const operations = events[eventName];
      execute(operations, root, context);
      target.addEventListener(eventName, function handler(event: Event) {
        let closest = event.target as HTMLElement | null;
        const { handlers } = context;
        while (closest) {
          for (const [node, handler] of handlers) {
            if (node === closest) {
              handler({ node: closest });
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
  }

  render(target: RenderTarget) {
    const clone = this.templateNode.cloneNode(true) as HTMLElement;
    const executeContext: ExecuteContext = {
      bindings: [],
      subscriptions: [],
      handlers: [],
    };
    this.listen(target, clone, executeContext);
    execute(this.content, clone, executeContext);
    target.appendChild(clone);

    return {
      dispose() {
        disposeAll(executeContext.bindings);
        clone.remove();
        for (const sub of executeContext.subscriptions) {
          sub.unsubscribe();
        }
      },
    };
  }
}

type DomEventOperation = DomNavigationOperation | AddEventListenerOperation;
type DomContentOperation =
  | DomNavigationOperation
  | SetTextContentOperation
  | DomRenderOperation
  | DomNavigationOperation
  | SetAttributeOperation
  | SetClassNameOperation;
