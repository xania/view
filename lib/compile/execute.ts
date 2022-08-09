import { ExpressionType } from '../expression';
import { RenderTarget } from '../renderable/render-target';
import { DomOperation, DomOperationType } from './dom-operation';

const renderStack: RenderTarget[] = [];

export function execute(
  operations: DomOperation[],
  items: ArrayLike<any> = [],
  getRootNode: (item: any, idx: number) => RenderTarget
) {
  for (let i = 0, itemsLen = items.length; i < itemsLen; i++) {
    const values = items[i];
    renderStack[0] = getRootNode(values, i);
    let renderIndex = 0;
    for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
      const operation = operations[n];
      // promote curr to ElementRef because we trust operation to only access valid properties
      const curr = renderStack[renderIndex];
      switch (operation.type) {
        case DomOperationType.PushChild:
          renderStack[++renderIndex] = curr.childNodes[
            operation.index
          ] as HTMLElement;
          break;
        case DomOperationType.PushFirstChild:
          renderStack[++renderIndex] = (curr as Node).firstChild as HTMLElement;
          break;
        case DomOperationType.PushNextSibling:
          renderStack[++renderIndex] = (curr as Node)
            .nextSibling as HTMLElement;
          break;
        case DomOperationType.PopNode:
          renderIndex--;
          break;
        case DomOperationType.SetTextContent:
          const textContentExpr = operation.expression;
          switch (textContentExpr.type) {
            case ExpressionType.Property:
              (curr as Node).textContent = values[textContentExpr.name];
              break;
            case ExpressionType.Function:
              const args = textContentExpr.deps.map((d) => values[d]);
              (curr as Node).textContent = textContentExpr.func.apply(
                null,
                args
              );
              break;
            case ExpressionType.State:
              textContentExpr.state.subscribe({
                next(s) {
                  (curr as Node).textContent = s;
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
              (curr as any)[operation.name] = propValue;
              // else delete (curr as any)[operation.name];
              break;
            case ExpressionType.Function:
              const args = attrExpr.deps.map((d) => values[d]);
              (curr as any)[operation.name] = attrExpr.func.apply(null, args);
              break;
            case ExpressionType.State:
              attrExpr.state.subscribe({
                next(s) {
                  (curr as any)[operation.name] = s;
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
                (curr as HTMLElement).className = propValue;
              else (curr as HTMLElement).className = '';
              break;
            case ExpressionType.Function:
              const args = classExpr.deps.map((d) => values[d]);
              const retval = classExpr.func.apply(null, args);
              if (retval) (curr as HTMLElement).className = retval;
              else (curr as HTMLElement).className = '';
              break;
            case ExpressionType.State:
              classExpr.state.subscribe({
                next(s) {
                  if (s) (curr as any).className = s;
                  else (curr as any).className = '';
                },
              });
              break;
          }
          break;
        case DomOperationType.AppendChild:
          (curr as Element).appendChild(operation.node);
          break;
        case DomOperationType.Renderable:
          operation.renderable.render(curr as Node, values);
          break;
      }
    }
  }
}
