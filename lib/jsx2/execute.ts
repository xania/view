import { DomOperation, DomOperationType } from '../compile/dom-operation';
import { ExpressionType } from '../jsx/expression';
import { isSubscribable, Unsubscribable } from '../util/is-subscibable';
import { Disposable } from '../disposable';
import { flatten } from './_flatten';

export function execute<TExecuteContext extends ExecuteContext>(
  operations: DomOperation[],
  root: HTMLElement,
  context: TExecuteContext
) {
  let nodeStack: Stack<Node> = { head: root, tail: null } as any;
  let operationStack: Stack<DomOperation> | null = arrayToStack(operations);

  while (operationStack) {
    const curr = operationStack.head;
    operationStack = operationStack.tail;
    switch (curr.type) {
      case DomOperationType.PushChild:
        nodeStack = {
          head: nodeStack.head.childNodes[curr.index],
          tail: nodeStack,
        };
        break;
      case DomOperationType.AddEventListener:
        context.handlers.push(
          nodeStack.head as Node,
          curr.name,
          curr.handler,
          context.values
        );
        break;
      case DomOperationType.PopNode:
        if (nodeStack.tail == null) {
          throw Error('reached end of stack');
        }
        nodeStack = nodeStack.tail;
        break;
      case DomOperationType.SetAttribute:
        const attrExpr = curr.expression;
        switch (attrExpr.type) {
          case ExpressionType.Property:
            const { values } = context;
            if (values) {
              const attrValue = values[attrExpr.name];
              if (isSubscribable(attrValue)) {
                operationStack = {
                  head: {
                    type: DomOperationType.SetAttribute,
                    name: curr.name,
                    expression: {
                      type: ExpressionType.State,
                      state: attrValue,
                    },
                  },
                  tail: operationStack,
                };
              } else (nodeStack.head as any)[curr.name] = values[attrExpr.name];
            }
            break;
          case ExpressionType.State:
            attrExpr.state.subscribe({
              elt: nodeStack.head as HTMLElement,
              name: curr.name,
              next(s: string) {
                (this.elt as any)[this.name] = s;
              },
            });
            break;
        }
        break;
      case DomOperationType.SetClassName:
        const classes = curr.classes;
        const classExpr = curr.expression;
        switch (classExpr.type) {
          case ExpressionType.Property:
            const propertyResult = context.values[classExpr.name];
            if (isSubscribable(propertyResult)) {
              operationStack = {
                head: {
                  type: DomOperationType.SetClassName,
                  expression: {
                    type: ExpressionType.State,
                    state: propertyResult,
                  },
                  classes,
                },
                tail: operationStack,
              };
            } else {
              const elt = nodeStack.head as HTMLElement;
              for (const x of flatten(propertyResult)) {
                const cls = (classes && classes[x]) || x;
                elt.classList.add(cls);
              }
            }
            break;
          case ExpressionType.Function:
            const result = classExpr.func(context.values, {
              index: -1,
              node: nodeStack.head,
            });
            if (isSubscribable(result)) {
              operationStack = {
                head: {
                  type: DomOperationType.SetClassName,
                  expression: {
                    type: ExpressionType.State,
                    state: result,
                  },
                  classes,
                },
                tail: operationStack,
              };
            } else {
              const elt = nodeStack.head as HTMLElement;
              for (const x of flatten(result)) {
                const cls = (classes && classes[x]) || x;
                elt.classList.add(cls);
              }
            }
            break;
          case ExpressionType.State:
            const prev: string[] = [];
            const subs = classExpr.state.subscribe({
              prev,
              classes: classes,
              elt: nodeStack.head as HTMLElement,
              next(s: string | string[]) {
                const { prev, classes } = this;
                for (const x of prev) {
                  this.elt.classList.remove(x);
                }
                prev.length = 0;
                for (const x of flatten(s)) {
                  const cls = (classes && classes[x]) || x;
                  this.elt.classList.add(cls);
                  prev.push(cls);
                }
              },
            });
            if (subs) context.subscriptions.push(subs);
            break;
        }
        break;
      case DomOperationType.SetTextContent:
        const setTextContentExpr = curr.expression;
        switch (setTextContentExpr.type) {
          case ExpressionType.Function:
            const result = setTextContentExpr.func(context.values, {
              index: -1,
              node: nodeStack.head,
            });
            if (isSubscribable(result)) {
              operationStack = {
                head: {
                  type: DomOperationType.SetTextContent,
                  expression: {
                    type: ExpressionType.State,
                    state: result,
                  },
                },
                tail: operationStack,
              };
            }
            break;
          case ExpressionType.State:
            const subs = setTextContentExpr.state.subscribe({
              element: nodeStack.head,
              next(newValue) {
                this.element.textContent = newValue;
              },
            });
            if (subs) context.subscriptions.push(subs);
            break;
        }
        break;
      case DomOperationType.UpdateContent:
        nodeStack.head.textContent = context.values[curr.property];
        break;
      case DomOperationType.UpdateAttribute:
        (nodeStack.head as any)[curr.name] = context.values[curr.property];
        break;
      case DomOperationType.AppendContent:
        const appendAppendContentExpr = curr.expression;
        const textNode = document.createTextNode('');
        nodeStack.head.appendChild(textNode);
        switch (appendAppendContentExpr.type) {
          case ExpressionType.Function:
            const result = appendAppendContentExpr.func(context.values, {
              index: -1,
              node: nodeStack.head,
            });
            if (isSubscribable(result)) {
              operationStack = {
                head: {
                  type: DomOperationType.AppendContent,
                  expression: {
                    type: ExpressionType.State,
                    state: result,
                  },
                },
                tail: operationStack,
              };
            }
            break;
          case ExpressionType.Property:
            textNode.textContent = context.values[appendAppendContentExpr.name];
            break;
          case ExpressionType.State:
            textNode.textContent = (appendAppendContentExpr.state as any)[
              'current'
            ];
            const subs = appendAppendContentExpr.state.subscribe({
              element: textNode,
              next(newValue) {
                this.element.textContent = newValue;
              },
            });
            if (subs) context.subscriptions.push(subs);
            break;
        }
        break;
      case DomOperationType.Renderable:
        const binding = curr.renderable.render(nodeStack.head);
        if (binding) context.bindings.push(binding);
        break;
      default:
        console.log(curr);
        break;
    }
  }
}

export interface ExecuteContext<T = any> {
  bindings: Disposable[];
  subscriptions: Unsubscribable[];
  handlers: {
    push(node: Node, name: string, handler: Function, values?: any): void;
  };
  values: T;
}

interface Stack<T> {
  head: T;
  tail: Stack<T> | null;
}

function arrayToStack<T>(arr: T[]): Stack<T> | null {
  let stack: Stack<T> | null = null;
  for (let i = arr.length - 1; i >= 0; i--) {
    stack = {
      head: arr[i],
      tail: stack,
    };
  }
  return stack;
}
