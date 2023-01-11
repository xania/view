import { ExpressionType } from '../jsx/expression';
import { JsxElement, pushChildAt, ViewContext } from '../jsx/element';
import {
  CloneOperation,
  DomOperation,
  DomOperationType,
  LazyOperation,
} from './dom-operation';
import { JsxEvent, resolveRootNode } from './listen';
import { TemplateInput } from '../jsx/template-input';
import { Anchor, isRenderable, RenderTarget } from '../jsx';
import { subscribe } from '../rx';
import { update } from './update';
import { isSubscribable } from '../jsx/observables';

export function compile(children: TemplateInput, target: RenderTarget) {
  var compileResult = new CompileResult<any>(target);
  return flatTemplates(children, compileResult.add).then((_) => {
    for (const op of compileResult.lazyOperations) {
      subscribe<any, any>(op.lazy, {
        next([item, newValue]: any) {
          if (!item) return;
          item[op.valueKey] = newValue;
          update([op.operation], [item]);

          const { attachables } = op.lazy;
          if (attachables?.length) {
            const node = item[op.nodeKey];
            const rootNode = resolveRootNode(target, node);
            if (rootNode) {
              for (const [n, f] of attachables) {
                if (rootNode.contains(n))
                  f({
                    data: item,
                    node: n,
                  } as ViewContext<any>);
              }
            }
          }

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

    return compileResult;
  });
}

export class CompileResult<T> {
  updateOperations: DomOperation<T>[] = [];
  renderOperations: DomOperation<T>[] = [];
  lazyOperations: LazyOperation<T>[] = [];
  events: [JsxEvent, number][] = [];

  constructor(public target: RenderTarget) {}

  addAnchoredOperation(op: DomOperation<T>) {
    const { target } = this;
    if (target instanceof Anchor) {
    } else {
      const anchorIdx = target.childNodes.length;
      const anchor = document.createComment('-- root anchor --');
      target.appendChild(anchor);
      pushChildAt(this.renderOperations, anchorIdx);
      this.renderOperations.push(op, {
        type: DomOperationType.PopNode,
        index: anchorIdx,
      });
      this.rootCount++;
    }
  }

  private rootCount: number = 0;

  add = (child: any): void => {
    if (child instanceof JsxElement) {
      const rootIndex = this.rootCount++;
      for (const evt of child.events) this.events.push([evt, rootIndex]);

      const { contentOps } = child;
      const cloneOp: CloneOperation = {
        type: DomOperationType.Clone,
        templateNode: child.templateNode,
        target: this.target,
      };

      this.renderOperations.push(cloneOp);

      for (let i = 0, len = contentOps.length; i < len; i++) {
        const op = contentOps[i];
        this.renderOperations.push(op);

        if (op.type === DomOperationType.SetTextContent) {
          const expr = op.expression;
          if (expr.type === ExpressionType.Property && !expr.readonly) {
            this.updateOperations.push(op);
          }
        }

        if (op.type === DomOperationType.SetClassName) {
          const expr = op.expression;
          if (expr.type === ExpressionType.Function) {
            this.updateOperations.push(op);
          }
        }

        if (op.type === DomOperationType.Lazy) {
          this.lazyOperations.push(op);
        }
      }
    } else if (isSubscribable(child)) {
      this.addAnchoredOperation({
        type: DomOperationType.Subscribable,
        observable: child,
      });
      // this.observables.push(child);
    } else if (isRenderable(child)) {
      this.addAnchoredOperation({
        type: DomOperationType.Renderable,
        renderable: child,
      });
    } else if (child !== null && child !== undefined) {
      this.renderOperations.push({
        type: DomOperationType.AppendText,
        value: child,
      });
    }

    //   }
    else {
      console.error('Not supported', child);
    }
  };

  ssr() {
    return "console.log('compile result');";
  }
}

type Tree<T> = T | Tree<T>[];
export async function flatTemplates<T, U>(
  tree: Tree<T | null>,
  map: (x: T) => U
): Promise<U[]> {
  const arr: U[] = [];

  const stack: Tree<T | null>[] = [tree];
  while (stack.length) {
    const curr = stack.pop();
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr instanceof Promise) {
      stack.push(await curr);
    } else if (curr) {
      arr.push(map(curr));
    }
  }

  return arr;
}
