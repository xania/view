import {
  AppendChildOperation,
  CloneOperation,
  DomNavigationOperation,
  DomOperationType,
  DomRenderOperation,
  LazyOperation,
  SetAttributeOperation,
  SetClassNameOperation,
  SetTextContentOperation,
  SubscribableOperation,
} from '../render/dom-operation';
import { JsxFactoryOptions } from './factory';
import { flatten } from './_flatten';
import { ExpressionType } from './expression';
import { TemplateInput } from './template-input';
import { isRenderable, RenderTarget } from './renderable';
import { disposeAll } from '../disposable';
import { State } from '../state';
import { isSubscribable } from '../util/observables';
import { isTemplate, TemplateType } from './template';
import { JsxEvent, listen } from '../render/listen';
import { Lazy } from './context';
import { ExecuteContext } from '../render/execute-context';

export class JsxElement {
  public templateNode: HTMLElement;
  public contentOps: DomContentOperation<any>[] = [];
  public events: JsxEvent[] = [];

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
        this.events.push({
          name: attrName,
          handler: attrValue,
          nav: [],
        });
      }
    } else if (attrName === 'class') {
      for (const item of flatten(attrValue)) {
        if (typeof item === 'string') {
          const classes = options?.classes;
          for (const cls of item.split(' ')) {
            if (cls) node.classList.add((classes && classes[cls]) || cls);
          }
        } else if (item instanceof Lazy) {
          this.contentOps.push({
            type: DomOperationType.Lazy,
            nodeKey: Symbol(),
            valueKey: Symbol(),
            lazy: item,
            operation: DomOperationType.SetClassName,
          });
        } else {
          const expr = toExpression(item);
          if (expr) {
            this.contentOps.push({
              key: Symbol(),
              type: DomOperationType.SetClassName,
              expression: expr,
              classes: options?.classes,
            });
          }
        }
      }
    } else if (isSubscribable(attrValue)) {
      this.contentOps.push({
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
          this.contentOps.push({
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

    const { templateNode, contentOps } = this;

    function addTextContentExpr(expr: JSX.Expression) {
      const newOperation: SetTextContentOperation = {
        key: Symbol(),
        nodeKey: Symbol(),
        type: DomOperationType.SetTextContent,
        expression: expr,
      };

      if (templateNode.childNodes.length === 0) {
        for (let i = contentOps.length - 1; i >= 0; i--) {
          const prevOperation = contentOps[i];
          if (prevOperation.type === DomOperationType.SetTextContent) {
            // found a text content operation at i that uses current templateNode exclusively
            // create a TextNode inside templateNode for this operation to use instead
            const textNode = document.createTextNode('');
            templateNode.appendChild(textNode);
            const pushFirstChild: DomContentOperation<any> = {
              type: DomOperationType.PushFirstChild,
            };
            const popFirstChild: DomContentOperation<any> = {
              type: DomOperationType.PopNode,
              index: 0,
            };
            contentOps.splice(
              i,
              1,
              pushFirstChild,
              prevOperation,
              popFirstChild
            );
          }
        }
      }

      const childIndex = templateNode.childNodes.length;
      if (childIndex === 0) {
        contentOps.push(newOperation);
      } else {
        addShared();
      }

      function addShared() {
        const textNode = document.createTextNode('');
        templateNode.appendChild(textNode);

        pushChildAt(contentOps, childIndex);
        contentOps.push(newOperation);
        contentOps.push({
          type: DomOperationType.PopNode,
          index: childIndex,
        });
      }
    }

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
        addTextContentExpr({
          type: ExpressionType.State,
          state: child,
        });
      } else if (child instanceof Node) {
        templateNode.appendChild(child);
      } else if ((child as any)['attachTo'] instanceof Function) {
        const anchor = document.createComment('<-- anchor: attach-to -->');
        templateNode.appendChild(anchor);
        contentOps.push({
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
          anchor,
        });
        // } else if (child instanceof Function) {
        //   addTextContentExpr({
        //     type: ExpressionType.Init,
        //     init: child as any,
        //   });
      } else if (isRenderable(child)) {
        const anchor = document.createComment('<-- anchor: renderable -->');
        templateNode.appendChild(anchor);
        contentOps.push({
          type: DomOperationType.Renderable,
          renderable: child,
          anchor,
        });
      } else if (isTemplate(child)) {
        switch (child.type) {
          case TemplateType.Expression:
            addTextContentExpr(child.expr);
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
        const anchor = document.createComment('<-- anchor: subscribable -->');
        templateNode.appendChild(anchor);
        contentOps.push({
          type: DomOperationType.Subscribable,
          subscribable: child,
          anchor,
        });
      } else {
        if (
          templateNode.textContent ||
          templateNode.childNodes.length ||
          this.contentOps.length
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
    const { templateNode: node, contentOps: content } = this;
    const childIndex = node.childNodes.length;
    if (tag.contentOps.length > 0) {
      pushChildAt(content, childIndex);
      for (let i = 0; i < tag.contentOps.length; i++) {
        this.contentOps.push(tag.contentOps[i]);
      }
      this.contentOps.push({
        type: DomOperationType.PopNode,
        index: childIndex,
      });
    }

    for (const ev of tag.events) {
      this.events.push({
        name: ev.name,
        nav: [
          {
            type: DomOperationType.PushChild,
            index: childIndex,
          },
          ...ev.nav,
        ],
        handler: ev.handler,
      });
    }

    this.templateNode.appendChild(tag.templateNode);
  }
}

type DomContentOperation<T> =
  | DomNavigationOperation
  | SetTextContentOperation
  | DomRenderOperation<T>
  | SetAttributeOperation
  | SetClassNameOperation
  | LazyOperation<T>
  | SubscribableOperation<T>
  | AppendChildOperation;

export interface EventContext<T, TEvent> extends JSX.EventContext<T, TEvent> {}

function pushChildAt(
  operations: DomContentOperation<any>[],
  childIndex: number
) {
  if (childIndex === 0) {
    operations.push({ type: DomOperationType.PushFirstChild });
    return;
  }
  const length = operations.length;
  if (length > 2) {
    const op = operations[length - 1];
    if (op.type === DomOperationType.PopNode) {
      const previousChildIndex = op.index;
      operations.pop();
      operations.push({
        type: DomOperationType.PushNextSibling,
        offset: childIndex - previousChildIndex,
      });

      return;
    }
  }

  operations.push({
    type: DomOperationType.PushChild,
    index: childIndex,
  });
}

function toExpression(item: any): JSX.Expression | null {
  if (item instanceof Function) {
    return {
      type: ExpressionType.Init,
      init: item as any,
    };
  } else if (isSubscribable(item)) {
    return {
      type: ExpressionType.State,
      state: item,
    };
  } else if (item instanceof State) {
    return {
      type: ExpressionType.State,
      state: item,
    };
  } else if (isTemplate(item)) {
    switch (item.type) {
      case TemplateType.Expression:
        return item.expr;
    }
  }

  // addTextContentExpr({
  //   type: ExpressionType.Curry,
  //   stateCurry: child,
  // });

  return null;
}
