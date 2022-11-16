import {
  DomNavigationOperation,
  DomOperation,
  DomOperationType,
  DomRenderOperation,
  HandleEventOperation,
  SetAttributeOperation,
  SetClassNameOperation,
  SetTextContentOperation,
} from '../compile/dom-operation';
import { RenderTarget } from '../jsx/renderable';
import { ExpressionType } from '../jsx/expression';
import { isSubscribable, Unsubscribable } from '../util/is-subscibable';
import { Disposable } from 'lib/disposable';
import { AnchorTarget } from './anchor-target';

interface JsxFactoryOptions {
  classes: {
    [p: string]: string;
  };
}

export function jsxFactory(opts?: JsxFactoryOptions) {
  return {
    createElement(
      name: string | Function,
      props: any = null,
      ...children: unknown[]
    ): TagTemplate | Promise<TagTemplate> | undefined {
      if (name instanceof Function) {
        return name(props, children);
      }

      const promises: Promise<void>[] = [];
      const tagTemplate = new TagTemplate(name);
      if (props) {
        for (const attrName in props) {
          const attrValue = props[attrName];
          const result = tagTemplate.setProp(
            attrName,
            attrValue,
            opts?.classes
          );
          if (result) {
            promises.push(result);
          }
        }
      }

      const result = tagTemplate.appendChildren(flatten(children));
      if (result instanceof Array) {
        for (const p of result) promises.push(p);
      }

      if (promises.length > 0)
        return Promise.all(promises).then(() => tagTemplate);
      else return tagTemplate;
    },
    createFragment(_: null, children: any[]) {
      return flatten(children);
    },
  };
}

export interface TemplateRender {
  render(target: RenderTarget): unknown;
}

type DomEventOperation = DomNavigationOperation | HandleEventOperation;
type DomContentOperation =
  | DomNavigationOperation
  | SetTextContentOperation
  | DomRenderOperation;
type DomAttributeOperation =
  | DomNavigationOperation
  | SetAttributeOperation
  | SetClassNameOperation;

class TagTemplate {
  public templateNode: HTMLElement;
  public events: { [name: string]: DomEventOperation[] } = {};
  public eventTargets: { [name: string]: DomEventOperation[] } = {};
  public content: DomContentOperation[] = [];
  public attrs: DomAttributeOperation[] = [];

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
          type: DomOperationType.HandleEvent,
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
          this.attrs.push({
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

  appendChildren(children: any[]): Promise<void>[] | void {
    if (!(children instanceof Array)) return;

    const result: Promise<void>[] = [];

    const { templateNode: node } = this;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof TagTemplate) {
        this.appendTag(child);
      } else if (child instanceof Promise) {
        const nextChildren = children.slice(i + 1);
        result.push(
          child.then((resolved: any) => {
            this.appendChildren([resolved, ...nextChildren]);
          })
        );
      } else if (child.render instanceof Function) {
        this.content.push({
          type: DomOperationType.Renderable,
          renderable: child,
        });
      } else if (isSubscribable(child)) {
        const stateNodeIndex = node.childNodes.length;
        const stateNode = document.createTextNode((child as any).current ?? '');
        node.appendChild(stateNode);
        this.content.push({
          type: DomOperationType.PushChild,
          index: stateNodeIndex,
        });
        this.content.push({
          type: DomOperationType.SetTextContent,
          expression: {
            type: ExpressionType.State,
            state: child,
          },
        });
        this.content.push({ type: DomOperationType.PopNode });
      } else {
        if (node.textContent || node.childNodes.length) {
          const textNode = document.createTextNode(child);
          node.appendChild(textNode);
        } else {
          node.textContent = child;
        }
      }
    }

    return result;
  }

  appendTag(tag: TagTemplate) {
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

    if (tag.attrs.length > 0) {
      this.attrs.push({
        type: DomOperationType.PushChild,
        index: node.childNodes.length,
      });
      for (const op of tag.attrs) {
        this.attrs.push(op);
      }
      this.attrs.push({
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

  render(target: RenderTarget) {
    const eventNames = Object.keys(this.events);
    const nodeClone = this.templateNode.cloneNode(true) as HTMLElement;
    target.appendChild(nodeClone);
    const events = this.events;

    const bindings: Disposable[] = [];
    const subscriptions: Unsubscribable[] = [];
    for (const eventName of eventNames) {
      const operations = events[eventName];
      const handlers: [Node, Function][] = [];
      execute(operations, nodeClone, {
        bindings,
        subscriptions,
        handlers,
      });
      nodeClone.addEventListener(eventName, function handler(event: Event) {
        let closest = event.target as HTMLElement | null;
        while (closest) {
          for (const [node, handler] of handlers) {
            if (node === closest) {
              handler({ node: closest });
            }
          }
          if (closest === nodeClone) {
            break;
          }
          closest = closest.parentElement;
        }
      });
    }
    const executeContext: ExecuteContext = {
      bindings,
      subscriptions,
      handlers: {
        push() {
          throw Error('Not supprted');
        },
      },
    };
    execute(this.attrs, nodeClone, executeContext);
    execute(this.content, nodeClone, executeContext);

    return {
      dispose() {
        nodeClone.remove();
        disposeAll(bindings);
        for (const sub of subscriptions) {
          sub.unsubscribe();
        }
      },
    };
  }
}

interface ExecuteContext {
  bindings: Disposable[];
  subscriptions: Unsubscribable[];
  handlers: {
    push(item: [Node, Function]): void;
  };
}

function execute(
  operations: DomOperation[],
  root: Node,
  context: ExecuteContext
) {
  let stack: Stack<Node> = { head: root, tail: null } as any;
  for (let i = 0; i < operations.length; i++) {
    const curr = operations[i];
    switch (curr.type) {
      case DomOperationType.PushChild:
        stack = { head: stack.head.childNodes[curr.index], tail: stack };
        break;
      case DomOperationType.HandleEvent:
        context.handlers.push([stack.head as Node, curr.handler]);
        break;
      case DomOperationType.PopNode:
        if (stack.tail == null) {
          throw Error('reached end of stack');
        }
        stack = stack.tail;
        break;
      case DomOperationType.SetAttribute:
        break;
      case DomOperationType.SetClassName:
        const classes = curr.classes;
        for (const classExpr of curr.expressions) {
          switch (classExpr.type) {
            case ExpressionType.State:
              const prev: string[] = [];
              const subs = classExpr.state.subscribe({
                prev,
                classes: classes,
                elt: stack.head as HTMLElement,
                next(s: string | string[]) {
                  const { prev, classes } = this;
                  for (const x of prev) {
                    this.elt.classList.remove(x);
                  }
                  prev.length = 0;
                  if (s instanceof Array) {
                    for (const x of s) {
                      const cls = (classes && classes[x]) || x;
                      this.elt.classList.add(cls);
                      prev.push(cls);
                    }
                  } else if (s) {
                    const cls = (classes && classes[s]) || s;
                    this.elt.classList.add(cls);
                    prev.push(cls);
                  }
                },
              });
              if (subs) context.subscriptions.push(subs);
              break;
          }
        }
        break;
      case DomOperationType.SetTextContent:
        const setTextContentExpr = curr.expression;
        switch (setTextContentExpr.type) {
          case ExpressionType.State:
            const subs = setTextContentExpr.state.subscribe({
              element: stack.head,
              next(newValue) {
                this.element.textContent = newValue;
              },
            });
            if (subs) context.subscriptions.push(subs);
            break;
        }
        break;
      case DomOperationType.Renderable:
        const binding = curr.renderable.render(stack.head);
        if (binding) context.bindings.push(binding);
        break;
      default:
        console.log(curr);
        break;
    }
  }
}

interface Stack<T> {
  head: T;
  tail: Stack<T>;
}

function flatten<T>(tree: T[]): T[] {
  const arr: T[] = [];

  const stack: (T | T[])[] = [tree];
  while (stack.length) {
    const curr = stack.pop();
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr) {
      arr.push(curr);
    }
  }

  return arr;
}

export function view(tpl: any) {
  return {
    render(target: RenderTarget) {
      return render(tpl, target);
    },
  };
}

function render(root: any, container: RenderTarget): any {
  if (root === null || root === undefined) return root;

  if (root instanceof Array) {
    return flatten(root.map((elt) => render(elt, container)));
  }

  if (root.render instanceof Function) {
    return root.render(container);
  }

  if (root instanceof Promise) {
    let cancelled = false;
    var anchor = new AnchorTarget(container);

    let bindings = root.then((e) => {
      if (!cancelled) {
        return e.render(anchor);
      }
    });
    return {
      dispose() {
        cancelled = true;
        return bindings.then(disposeAll);
      },
    };
  }

  if (isSubscribable(root)) {
    let binding: Disposable | null = null;
    var anchor = new AnchorTarget(container);

    const subs = root.subscribe({
      next(value) {
        disposeAll(binding);
        binding = render(value, anchor);
      },
    });

    return {
      dispose() {
        subs.unsubscribe();
      },
    };
  }

  if (root instanceof Node) {
    container.appendChild(root);
    return {
      dispose() {
        container.removeChild(root);
      },
    };
  }

  {
    const textNode = document.createTextNode(root);
    container.appendChild(textNode);
    return {
      dispose() {
        textNode.remove();
      },
    };
  }
}

function disposeAll(bindings: any) {
  const stack = [bindings];

  while (stack.length > 0) {
    const curr = stack.pop();
    if (curr instanceof Array) {
      for (const e of curr) stack.push(e);
    } else if (curr && curr.dispose instanceof Function) {
      curr.dispose();
    }
  }
}
