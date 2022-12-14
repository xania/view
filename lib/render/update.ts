import { DomOperation, DomOperationType } from './dom-operation';
import { ExpressionType } from '../jsx/expression';
import { ExecuteContext } from './execute-context';

export function update<TExecuteContext extends ExecuteContext>(
  operations: DomOperation<any>[],
  contexts: ArrayLike<TExecuteContext>
) {
  for (
    let contextIdx = 0,
      contextsLen = contexts.length | 0,
      operationLen = operations.length | 0;
    contextIdx < contextsLen;
    contextIdx++
  ) {
    const context = contexts[contextIdx];
    for (let operationIdx = 0; operationIdx < operationLen; operationIdx++) {
      const op = operations[operationIdx];
      switch (op.type) {
        case DomOperationType.SetTextContent:
          const setContentExpr = op.expression;

          switch (setContentExpr.type) {
            case ExpressionType.Property:
              let propertyValue = context[setContentExpr.name];
              let node = context[op.nodeKey] as HTMLElement;
              node.textContent = propertyValue ?? '';
              break;
          }

          break;
        case DomOperationType.SetClassName:
          const setClassExpr = op.expression;
          const classes = op.classes;
          const classList = context[op.nodeKey].classList;

          const prevValue = context[op.prevKey] || [];
          if (prevValue instanceof Array) {
            for (const cls of prevValue) {
              classList.remove(cls);
            }
          }

          let classValue;
          switch (setClassExpr.type) {
            case ExpressionType.Property:
              classValue = context[setClassExpr.name];
              break;
            case ExpressionType.Function:
              classValue = setClassExpr.func(context);
              break;
          }

          if (classValue instanceof Array) {
            for (const x of classValue) {
              const cls = classes ? classes[x] : x;
              classList.add(cls);
              prevValue.push(cls);
            }
          } else if (classValue) {
            const cls = classes ? classes[classValue] : classValue;
            classList.add(cls);
            prevValue.push(cls);
          }

          (context as any)[op.prevKey] = prevValue;
          break;
        case DomOperationType.SetAttribute:
          const setAttrExpr = op.expression;
          const node = context[op.nodeKey];
          switch (setAttrExpr.type) {
            case ExpressionType.Property:
              const newValue = context[setAttrExpr.name];
              node[op.name] = newValue;

              break;
          }
          break;
        default:
          console.error(op);
          break;
      }
    }
  }
}
