import { DomOperation, DomOperationType } from './dom-operation';
import { ExpressionType, isExpression } from '../jsx/expression';
import { Disposable } from '../disposable';
import { flatten } from '../jsx/_flatten';
import { State } from '../state';
// import { Unsubscribable } from '../util/observables';

export function execute<TExecuteContext extends ExecuteContext>(
  operations: DomOperation<any>[],
  root: HTMLElement,
  context: TExecuteContext
) {
  let nodeStack: Stack<Node> = { head: root, tail: null } as any;
  let operationStack: Stack<DomOperation<any>> | null =
    arrayToStack(operations);
  const values = context.data?.snapshot;

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
        context.push(nodeStack.head as Node, curr.name, curr.handler);
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
            const attrValue =
              attrExpr.name === null
                ? context.data
                : context.data?.get(attrExpr.name);
            if (attrValue) {
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
            }
            break;
          case ExpressionType.State:
            attrExpr.state.subscribe({
              elt: nodeStack.head as HTMLElement,
              name: curr.name,
              next(s: string) {
                const { elt, name } = this;
                (elt as any)[name] = s;
              },
            });
            break;
        }
        break;
      case DomOperationType.SetClassName:
        const classes = curr.classes;
        const classExpr = curr.expression;
        const classData = context.data;
        if (classData === undefined) break;
        switch (classExpr?.type) {
          case ExpressionType.Init:
            const initResult = classExpr.init(classData, {
              node: nodeStack.head,
              data: classData,
            });
            if (isExpression(initResult)) {
              operationStack = {
                head: {
                  type: DomOperationType.SetClassName,
                  expression: initResult,
                  classes,
                },
                tail: operationStack,
              };
            } else if (typeof initResult === 'string') {
              const cl = (classes && classes[initResult]) || initResult;
              const elt = nodeStack.head as HTMLElement;
              elt.classList.add(cl);
            }
            break;
          case ExpressionType.Property:
            const propertyResult =
              classExpr.name === null
                ? context.data
                : context.data?.get(classExpr.name);
            if (propertyResult === undefined) break;
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
            break;
          case ExpressionType.State:
            const prev: string[] = [];
            const subs = classExpr.state.subscribe({
              prev,
              classes,
              elt: nodeStack.head as HTMLElement,
              next(s) {
                const { prev, classes, elt } = this;
                for (const x of prev) {
                  elt.classList.remove(x);
                }
                prev.length = 0;
                for (const x of flatten(s)) {
                  const cls = (classes && classes[x]) || x;
                  elt.classList.add(cls);
                  prev.push(cls);
                }
              },
            });
            if (subs) context.subscriptions.push(subs);
            break;
          default:
            if (classExpr) {
              const elt = nodeStack.head as HTMLElement;
              for (const x of flatten(classExpr.toString())) {
                const cls = (classes && classes[x]) || x;
                elt.classList.add(cls);
              }
            }
            break;
        }
        break;

      case DomOperationType.SetTextContent:
        const setContentExpr = curr.expression;
        const data = context.data;
        if (data === undefined) break;
        switch (setContentExpr.type) {
          case ExpressionType.Init:
            const initResult = setContentExpr.init(data, {
              node: nodeStack.head,
              data,
            });
            if (isExpression(initResult)) {
              operationStack = {
                head: {
                  type: DomOperationType.SetTextContent,
                  expression: initResult,
                },
                tail: operationStack,
              };
            } else if (initResult) {
              if (curr.textNodeIndex !== undefined) {
                nodeStack.head.childNodes[curr.textNodeIndex].textContent =
                  initResult;
              } else {
                nodeStack.head.textContent = initResult;
              }
            }
            break;
          case ExpressionType.Property:
            if (values) {
              const property =
                setContentExpr.name === null
                  ? context.data
                  : context.data?.get(setContentExpr.name);
              if (property === undefined) break;
              operationStack = {
                head: {
                  type: DomOperationType.SetTextContent,
                  textNodeIndex: curr.textNodeIndex,
                  expression: {
                    type: ExpressionType.State,
                    state: property,
                  },
                },
                tail: operationStack,
              };
            }
            break;
          // case ExpressionType.Property:
          //   const propertyValue = context.values[appendContentExpr.name];
          //   textNode.textContent = propertyValue;
          //   if (propertyValue instanceof State) {
          //     const subs = propertyValue.subscribe(
          //       appendContentStateObserver,
          //       textNode
          //     );
          //     if (subs) context.subscriptions.push(subs);
          //   }
          //   break;
          case ExpressionType.State:
            const { state } = setContentExpr;
            const textNodeIndex = curr.textNodeIndex;
            const textNode =
              textNodeIndex === undefined
                ? nodeStack.head
                : nodeStack.head.childNodes[textNodeIndex];
            const stateSubs = state.subscribe({
              next(newValue: any) {
                const { textNode } = this;
                textNode.textContent = newValue;
              },
              textNode: textNode as Text,
            });
            if (stateSubs) context.subscriptions.push(stateSubs);
            break;
        }
        break;
      case DomOperationType.Renderable:
        const binding: null | Disposable | JSX.Unsubscribable =
          curr.renderable.render(nodeStack.head, context);
        if (binding) {
          if ('dispose' in binding && binding.dispose instanceof Function)
            context.bindings.push(binding);
          else if (
            'unsubscribe' in binding &&
            binding.unsubscribe instanceof Function
          ) {
            context.subscriptions.push(binding);
          }
        }
        break;
      default:
        console.error(curr);
        break;
    }
  }
}

export interface ExecuteContext<T = any> {
  bindings: Disposable[];
  subscriptions: JSX.Unsubscribable[];
  elements: HTMLElement[];
  data: State<T>;
  push(node: Node, name: string, handler: Function): void;
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
