import {
  DomNavigationOperation,
  DomOperation,
  DomOperationType,
  DomRenderOperation,
  HandleEventOperation,
  SetTextContentOperation,
} from '../compile/dom-operation';
import { RenderTarget } from '../jsx/renderable';
import { ExpressionType } from '../jsx/expression';
import { isSubscribable } from '../util/is-subscibable';

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

      const tagTemplate = new TagTemplate(name);
      if (props) {
        tagTemplate.setProps(props, opts?.classes);
      }

      return tagTemplate.appendChildren(flatten(children));
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

class TagTemplate {
  public templateNode: HTMLElement;
  public events: { [name: string]: DomEventOperation[] } = {};
  public content: DomContentOperation[] = [];

  constructor(public name: string) {
    this.templateNode = document.createElement(name);
  }

  setProps(props: any, classes?: JsxFactoryOptions['classes']) {
    if (!props) return;
    const { templateNode: node } = this;
    for (const attrName in props) {
      const attrValue = props[attrName];
      if (('on' + attrName).toLocaleLowerCase() in HTMLElement.prototype) {
        if (attrValue instanceof Function) {
          const eventOperations =
            this.events[attrName] ?? (this.events[attrName] = []);
          eventOperations.push({
            type: DomOperationType.HandleEvent,
            handler: attrValue,
          });
        }
      } else if (attrName === 'class') {
        for (const cls of attrValue.split(' ')) {
          if (cls) node.classList.add((classes && classes[cls]) || cls);
        }
      } else {
        node.setAttribute(attrName, attrValue);
      }
    }
  }

  appendChildren(children: any[]): this | Promise<this> {
    if (!(children instanceof Array)) return this;

    const { templateNode: node } = this;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof TagTemplate) {
        this.appendTag(child);
      } else if (child instanceof Promise) {
        const nextChildren = children.slice(i + 1);
        return child.then((resolved: any) => {
          return this.appendChildren([resolved, ...nextChildren]);
        });
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
    return this;
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
    if (eventNames.length || this.content.length) {
      const nodeClone = this.templateNode.cloneNode(true) as HTMLElement;
      target.appendChild(nodeClone);
      const events = this.events;
      for (const eventName of eventNames) {
        nodeClone.addEventListener(eventName, function handler(event: Event) {
          const operations = events[eventName];
          execute(operations, nodeClone, event.target as Node);
        });
      }
      execute(this.content, nodeClone);
    } else {
      // there are no dynamic contextual differences for this template, so just render the template node itself
      target.appendChild(this.templateNode);
    }
  }
}

function execute(
  operations: DomOperation[],
  root: Node,
  target: Node | null = null
) {
  let stack: Stack<Node> = { head: root, tail: null } as any;
  for (let i = 0; i < operations.length; i++) {
    const curr = operations[i];
    switch (curr.type) {
      case DomOperationType.PushChild:
        stack = { head: stack.head.childNodes[curr.index], tail: stack };
        break;
      case DomOperationType.HandleEvent:
        let closest = target;
        do {
          if (stack.head === closest) {
            curr.handler();
            break;
          } else if (closest) {
            closest = closest.parentElement;
          } else {
            break;
          }
        } while (closest !== root);
        break;
      case DomOperationType.PopNode:
        if (stack.tail == null) {
          console.error('reached end of stack');
          return;
        }
        stack = stack.tail;
        break;
      case DomOperationType.SetTextContent:
        const setTextContentExpr = curr.expression;
        switch (setTextContentExpr.type) {
          case ExpressionType.State:
            setTextContentExpr.state.subscribe({
              element: stack.head,
              next(newValue) {
                this.element.textContent = newValue;
              },
            });
            break;
        }
        break;
      case DomOperationType.Renderable:
        curr.renderable.render(stack.head);
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

  const stack = tree.slice(0).reverse();
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
  if (root instanceof Array) {
    return flatten(root.map((elt) => render(elt, container)));
  }

  if (root.render instanceof Function) {
    return root.render(container);
  }

  if (root instanceof Promise) {
    let cancelled = false;
    let bindings = root.then((e) => {
      if (!cancelled) {
        return e.render(container);
      }
    });
    return {
      dispose() {
        cancelled = true;
        return bindings.then(disposeAll);
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
