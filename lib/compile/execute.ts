import { Disposable } from '../abstractions/disposable';
import { ExpressionType } from '../expression';
import { RenderTarget } from '../renderable/render-target';
import { createScope } from '../renderable/scope';
import { DomOperation, DomOperationType } from './dom-operation';
import { disposeKey } from './helpers';

export function execute(
  operations: DomOperation[],
  rootNodes: RenderTarget[],
  items: ArrayLike<any>,
  offset: number,
  length: number
) {
  const renderStack: RenderTarget[] = new Array();
  let results: Disposable | Disposable[] | undefined = undefined;

  for (let n = 0, len = length; n < len; n = (n + 1) | 0) {
    const values = items[n];
    const rootNode = rootNodes[n + offset];
    renderStack[0] = rootNode;
    let renderIndex = 0;
    for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
      const operation = operations[n];
      // promote curr to ElementRef because we trust operation to only access valid properties
      const curr = renderStack[renderIndex];
      switch (operation.type) {
        case DomOperationType.PushChild:
          renderStack[++renderIndex] = curr.childNodes[
            operation.index
          ] as RenderTarget;
          break;
        case DomOperationType.PushFirstChild:
          renderStack[++renderIndex] = (curr as Node)
            .firstChild as RenderTarget;
          break;
        case DomOperationType.PushNextSibling:
          renderStack[renderIndex] = (curr as Node).nextSibling as RenderTarget;
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
        case DomOperationType.SetClassName:
          const classExpr = operation.expression;
          switch (classExpr.type) {
            case ExpressionType.Property:
              (curr as any)['className'] = values[classExpr.name];
              break;
            case ExpressionType.Function:
              const args = classExpr.deps.map((d) => values[d]);
              (curr as any)['className'] = classExpr.func.apply(null, args);
              break;
            case ExpressionType.State:
              classExpr.state.subscribe({
                next(s) {
                  (curr as any)['className'] = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetAttribute:
          const attrExpr = operation.expression;
          switch (attrExpr.type) {
            case ExpressionType.Property:
              (curr as any)[operation.name] = values[attrExpr.name];
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
        case DomOperationType.AppendChild:
          (curr as Element).appendChild(operation.node);
          break;
        case DomOperationType.Renderable:
          const { index } = operation;
          const { childNodes } = curr;
          let result: Disposable | void;
          if (index >= 0 && index < childNodes.length) {
            const scope = createScope(curr, childNodes[index]);
            result = operation.renderable.render(scope, values);
          } else {
            result = operation.renderable.render(curr as RenderTarget, values);
          }

          if (result) {
            bindDisposable(rootNode, result);
          }

          break;
      }
    }
  }
  return results;
}

function bindDisposable(rootNode: any, disposable: Disposable) {
  const results = rootNode[disposeKey] || [];
  results.push(disposable);
  rootNode[disposeKey] = results;
}
