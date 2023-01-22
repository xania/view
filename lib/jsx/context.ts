import { ExecuteContext } from '../render/execute-context';
import { notify } from '../rx';
import { _observers } from '../rx/symbols';
import { Expression, ExpressionType } from './expression';
import { NextObserver } from './observables';

export class Context<T> {
  lazy<U>(value: U) {
    return new Lazy<T, U>(value);
  }

  readonly(name: keyof T) {
    return this.get(name, true);
  }

  get(name: keyof T, readonly: boolean = false): Expression {
    return {
      type: ExpressionType.Property,
      name,
      readonly,
    };
  }

  map<U>(func: (c: T) => U): Expression {
    return {
      type: ExpressionType.Function,
      func,
    };
  }
}

export class Lazy<T, U> {
  constructor(public value: U) {}

  select(context: T) {
    notify(this, [context, this.value]);
    return () => {
      notify(this, [context, null]);
    };
  }

  lazy(observer: NextObserver<[ExecuteContext, U]>) {
    const state = this as any;
    const observers = state[_observers] ?? (state[_observers] = []);
    observers.push(observer);

    return {
      unsubscribe: () => {
        const observers = (this as any)[_observers] as any[];
        if (observers) {
          const idx = observers.indexOf(observer);
          if (idx >= 0) {
            observers.splice(idx, 1);
          }
        }
      },
    };
  }

  attach(func: (node: Node) => void) {
    const self = this;
    const attachable = {
      attachTo(node: HTMLElement) {
        // attachables.push([x, func]);
        return self.lazy({
          next([context, value]: [ExecuteContext, U]) {
            if (value === null) {
              return;
            }
            const rootNode = context.rootElement;
            if (rootNode && rootNode.contains(node)) {
              func(node);
              //       f({
              //         data: item,
              //         node: n,
              //       } as ViewContext<any>);
            }

            // const node = context[op.nodeKey];
            // const rootNode = resolveRootNode(target, node);
            // if (rootNode) {
            //   for (const [n, f] of attachables) {
            //     if (rootNode.contains(n))
            //       f({
            //         data: item,
            //         node: n,
            //       } as ViewContext<any>);
            //   }
            // }
          },
        });
      },
    };

    return attachable;
  }
}

export function useContext<T>() {
  return new Context<T>();
}
