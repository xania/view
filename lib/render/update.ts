import { DomOperation, DomOperationType } from './dom-operation';
import { ExpressionType } from '../jsx/expression';
import { ExecuteContext } from './execute-context';
import { _context } from './symbols';

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
          let node = context[op.nodeKey] as HTMLElement;

          switch (setContentExpr.type) {
            case ExpressionType.Property:
              let propertyValue = context[setContentExpr.name];
              node.textContent = propertyValue ?? '';
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
