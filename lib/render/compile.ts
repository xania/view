import { ExpressionType } from '../jsx/expression';
import { JsxElement } from '../jsx/element';
import {
  CloneOperation,
  DomOperation,
  DomOperationType,
  LazyOperation,
} from './dom-operation';
import { JsxEvent } from './listen';
import { TemplateInput } from '../jsx/template-input';
import { flatten } from '../jsx/_flatten';
import { RenderTarget } from '../jsx';
import { subscribe } from '../rx';
import { execute } from './execute';

export function compile<T = any>(
  children: TemplateInput,
  target: RenderTarget
) {
  const updateOperations: DomOperation<T>[] = [];
  const renderOperations: DomOperation<T>[] = [];
  const lazyOperations: LazyOperation<T>[] = [];
  const events: JsxEvent[] = [];

  for (let child of flatten(children)) {
    if (child instanceof JsxElement) {
      for (const evt of child.events) events.push(evt);

      const { contentOps } = child;
      const cloneOp: CloneOperation = {
        type: DomOperationType.Clone,
        templateNode: child.templateNode,
        target,
      };

      renderOperations.push(cloneOp);

      for (let i = 0, len = contentOps.length; i < len; i++) {
        const op = contentOps[i];
        renderOperations.push(op);

        if (op.type === DomOperationType.SetTextContent) {
          const expr = op.expression;
          if (expr.type === ExpressionType.Property && !expr.readonly) {
            updateOperations.push(op);
          }
        }

        if (op.type === DomOperationType.Lazy) {
          lazyOperations.push(op);
        }
      }
    } else {
      console.error('Not supported', child);
    }
  }

  for (const op of lazyOperations) {
    subscribe<any, any>(op.lazy, {
      next([item, newValue]: any) {
        if (!item) return;
        const ref = (item as any)[op.nodeKey] as HTMLElement;
        item[op.valueKey] = newValue;

        execute([op.operation], [item], ref);

        // if (prevValue) {
        //   ref.classList.remove(prevValue);
        // }

        // if (newValue) {
        //   const classes = jsxOpts?.classes;
        //   const cls = classes ? classes[newValue] : newValue;
        //   item[op.valueKey] = cls;

        //   ref.classList.add(cls);
        // }
      },
    });
  }

  return {
    updateOperations,
    renderOperations,
    lazyOperations,
    events,
  };
}
