import { DomOperation, DomOperationType } from '../compile/dom-operation';
import { ExpressionType } from '../jsx/expression';
import { Unsubscribable } from '../util/is-subscibable';
import { Disposable } from 'lib/disposable';

export function execute(
  operations: DomOperation[],
  root: HTMLElement,
  context: ExecuteContext
) {
  let stack: Stack<Node> = { head: root, tail: null } as any;
  for (let i = 0; i < operations.length; i++) {
    const curr = operations[i];
    switch (curr.type) {
      case DomOperationType.PushChild:
        stack = { head: stack.head.childNodes[curr.index], tail: stack };
        break;
      case DomOperationType.AddEventListener:
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
      case DomOperationType.AppendContent:
        const setAppendContentExpr = curr.expression;
        const textNode = document.createTextNode('');
        stack.head.appendChild(textNode);
        switch (setAppendContentExpr.type) {
          case ExpressionType.State:
            textNode.textContent = (setAppendContentExpr.state as any)[
              'current'
            ];
            const subs = setAppendContentExpr.state.subscribe({
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
        const binding = curr.renderable.render(stack.head);
        if (binding) context.bindings.push(binding);
        break;
      default:
        console.log(curr);
        break;
    }
  }
}

export interface ExecuteContext {
  bindings: Disposable[];
  subscriptions: Unsubscribable[];
  handlers: [Node, Function][];
}

interface Stack<T> {
  head: T;
  tail: Stack<T>;
}
