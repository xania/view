import { RenderTarget } from '../jsx';
import { DomOperation, DomOperationType } from '../compile/dom-operation';
import { ExpressionType } from '../jsx/expression';

export function execute(
  operations: DomOperation[],
  context: ExecuteContext,
  dom: symbol,
  values: symbol
) {
  const { offset, data } = context;
  for (let i = offset, itemsLen = data.length; i < itemsLen; i++) {
    const vitem = data[i];
    const item = vitem[values];
    let stack: Stack<any> = {
      head: vitem[dom],
    };
    for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
      const operation = operations[n];
      switch (operation.type) {
        case DomOperationType.SelectNode:
          stack = {
            head: vitem[dom],
            tail: stack,
          };
          break;
        case DomOperationType.PushChild:
          stack = { head: stack.head.childNodes[operation.index], tail: stack };
          break;
        case DomOperationType.PushFirstChild:
          stack = {
            head: (stack.head as Node).firstChild as HTMLElement,
            tail: stack,
          };
          break;
        case DomOperationType.PushNextSibling:
          stack = {
            head: (stack.head as Node).nextSibling as HTMLElement,
            tail: stack.tail,
          };
          break;
        case DomOperationType.PopNode:
          stack = stack.tail as any;
          break;
        case DomOperationType.SetTextContent:
          const textContentExpr = operation.expression;
          switch (textContentExpr.type) {
            case ExpressionType.Property:
              (stack.head as Node).textContent = item[textContentExpr.name];
              break;
            case ExpressionType.Function:
              (stack.head as Node).textContent = textContentExpr.func.apply(
                null,
                [item]
              );
              break;
            case ExpressionType.State:
              const elt = stack.head as Node;
              textContentExpr.state.subscribe({
                next(s) {
                  elt.textContent = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetAttribute:
          const attrExpr = operation.expression;
          switch (attrExpr.type) {
            case ExpressionType.Property:
              const propValue = item[attrExpr.name];
              // if (propValue !== null && propValue !== undefined)
              (stack.head as any)[operation.name] = propValue;
              // else delete (curr as any)[operation.name];
              break;
            case ExpressionType.Function:
              (stack.head as any)[operation.name] = attrExpr.func.apply(null, [
                item,
              ]);
              break;
            case ExpressionType.State:
              attrExpr.state.subscribe({
                next(s) {
                  (stack.head as any)[operation.name] = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetClassName:
          {
            const { expressions } = operation;
            for (const classExpr of expressions) {
              switch (classExpr.type) {
                case ExpressionType.Property:
                  const propValue = vitem[classExpr.name];
                  if (propValue !== null && propValue !== undefined)
                    (stack.head as HTMLElement).className = propValue;
                  else (stack.head as HTMLElement).className = '';
                  break;
                case ExpressionType.State:
                  const stateElt = stack.head as HTMLElement;
                  const prev: string[] = [];
                  classExpr.state.subscribe({
                    prev,
                    next(s: string | string[]) {
                      const { prev } = this;
                      for (const x of prev) {
                        stateElt.classList.remove(x);
                      }
                      prev.length = 0;
                      if (s instanceof Array) {
                        for (const x of s) {
                          stateElt.classList.add(x);
                          prev.push(x);
                        }
                      } else if (s) {
                        stateElt.classList.add(s);
                        prev.push(s);
                      }
                    },
                  });
                  break;
              }
            }
          }
          break;
        case DomOperationType.AppendChild:
          (stack.head as Element).appendChild(operation.node);
          break;
        case DomOperationType.Renderable:
          operation.renderable.render(stack.head as Node, item);
          break;
        case DomOperationType.AttachTo:
          operation.attachable.attachTo(stack.head as HTMLElement);
          break;
      }
    }
  }
}

interface Stack<T> {
  readonly head: T;
  readonly tail?: Stack<T>;
}

export interface ExecuteContext {
  target: RenderTarget;
  data: any[];
  offset: number;
}
