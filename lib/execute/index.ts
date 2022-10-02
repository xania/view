import { ExpressionType } from '../jsx';
import { RenderTarget } from '../jsx';
import { DomOperation, DomOperationType } from '../compile/dom-operation';

export function execute(
  operations: DomOperation[],
  context: ExecuteContext,
  dom: symbol
) {
  const { offset, data } = context;
  for (let i = offset, itemsLen = data.length; i < itemsLen; i++) {
    const values = data[i];
    let stack: Stack<any> = {
      head: values[dom],
    };
    for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
      const operation = operations[n];
      // promote curr to ElementRef because we trust operation to only access valid properties
      switch (operation.type) {
        case DomOperationType.SelectNode:
          stack = {
            head: values[dom],
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
              (stack.head as Node).textContent = values[textContentExpr.name];
              break;
            case ExpressionType.Function:
              const args = textContentExpr.deps.map((d) => values[d]);
              (stack.head as Node).textContent = textContentExpr.func.apply(
                null,
                args
              );
              break;
            case ExpressionType.State:
              textContentExpr.state.subscribe({
                next(s) {
                  (stack.head as Node).textContent = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetAttribute:
          const attrExpr = operation.expression;
          switch (attrExpr.type) {
            case ExpressionType.Property:
              const propValue = values[attrExpr.name];
              // if (propValue !== null && propValue !== undefined)
              (stack.head as any)[operation.name] = propValue;
              // else delete (curr as any)[operation.name];
              break;
            case ExpressionType.Function:
              const args = attrExpr.deps.map((d) => values[d]);
              (stack.head as any)[operation.name] = attrExpr.func.apply(
                null,
                args
              );
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
          const classExpr = operation.expression;
          switch (classExpr.type) {
            case ExpressionType.Property:
              const propValue = values[classExpr.name];
              if (propValue !== null && propValue !== undefined)
                (stack.head as HTMLElement).className = propValue;
              else (stack.head as HTMLElement).className = '';
              break;
            case ExpressionType.Function:
              const args = classExpr.deps.map((d) => values[d]);
              const retval = classExpr.func.apply(null, args);
              if (retval) (stack.head as HTMLElement).className = retval;
              else (stack.head as HTMLElement).className = '';
              break;
            case ExpressionType.State:
              classExpr.state.subscribe({
                next(s) {
                  if (s) (stack.head as any).className = s;
                  else (stack.head as any).className = '';
                },
              });
              break;
          }
          break;
        case DomOperationType.AppendChild:
          (stack.head as Element).appendChild(operation.node);
          break;
        case DomOperationType.Renderable:
          operation.renderable.render(stack.head as Node, values);
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
