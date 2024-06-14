type UpdateInput<T> = JSX.MaybePromise<{
  [k in keyof T]?: T[k] | Promise<T[k]>;
}>;
export type ReactiveGraph = {
  readonly nodes: ReactiveNode[];
  readonly scope: { [key: symbol]: any };
  readonly output: { [key: symbol | string | number]: any };
  readonly operators: Operator[];
  push(node: ReactiveNode): void;
  get(node: { key: symbol }): any;
  update<T>(
    node: ReactiveNode<T>,
    newValue: UpdateInput<T>
  ): boolean | Promise<boolean>;
  export<T>(node: ReactiveNode<T>, prop: symbol | number | string): void;
};

interface ReactiveNode<T = any> {
  key: symbol;
  initial?: T;
}

export enum OperatorEnum {
  Prop = 1,
  Export = 2,
  Call = 3,
  Connect = 4,
  CombineLatest = 5,
  When = 6,
}

export type Operator =
  | GetOperator
  | ExportOperator
  | ConnectOperator
  | CallOperator
  | CombineLatestOperator
  | WhenOperator;

export interface WhenOperator {
  type: OperatorEnum.When;
  source: symbol;
}

export interface GetOperator {
  type: OperatorEnum.Prop;
  source: symbol;
  target: symbol;
  prop: string;
}

export interface ExportOperator {
  type: OperatorEnum.Export;
  source: symbol;
  prop: string | number | symbol;
}

export interface ConnectOperator {
  type: OperatorEnum.Connect;
  source: symbol;
  target: symbol;
  prop: string | number;
}

export interface CombineLatestOperator {
  type: OperatorEnum.CombineLatest;
  source: symbol;
  target: symbol;
}

export interface CallOperator {
  type: OperatorEnum.Call;
  source: symbol;
  target: symbol;
  func: Function;
  context: any;
}

export function create(operatorProvider: OperatorProvider): ReactiveGraph {
  const nodes: ReactiveNode[] = [];
  const lookups: { [key: symbol]: ReactiveNode } = {};
  const scope: ReactiveGraph['scope'] = {};
  const output: ReactiveGraph['output'] = {};
  const operators: Operator[] = [];
  return {
    nodes,
    scope,
    operators,
    output,
    export<T, U>(node: ReactiveNode<T>, prop: keyof U) {
      this.push(node);
      operators.push({
        type: OperatorEnum.Export,
        source: node.key,
        prop,
      });
    },
    update<T>(node: ReactiveNode<T>, newValue: T) {
      const { key: nodeKey } = node;
      const currentValue = scope[nodeKey];
      if (currentValue === newValue) {
        return false;
      }
      scope[nodeKey] = newValue;
      const p = reconcile(this, 0, {
        [nodeKey]: true,
      });

      if (p instanceof Promise) {
        return p.then(() => true);
      }

      return true;
    },

    push(node: ReactiveNode) {
      // using dfs algorithm,
      // could have used bfs here to decrease duplications in pending array,
      // and by that possible increase in performance, but for now I dont have
      // meaningful benchmark to make a solid choice. bfs uses shift in stead of pop
      // which is probably less performant anyway (claim by Douglas Crockford).
      const stack = [node];
      const pending: ReactiveNode[] = [];

      while (stack.length) {
        const curr = stack.pop()!;

        if (!curr || lookups[curr.key]) {
          continue;
        }

        pending.push(curr);

        const dependencies = operatorProvider.dependencies(curr);
        if (dependencies instanceof Array) {
          for (const dep of dependencies) {
            if (dep) {
              stack.push(dep);
            }
          }
        } else if (dependencies) {
          stack.push(dependencies);
        }
      }

      while (pending.length) {
        const curr = pending.pop()!;
        const { key } = curr;
        if (!lookups[key]) {
          lookups[key] = curr;
          nodes.push(curr);

          if (curr.initial !== undefined) {
            scope[key] = curr.initial;
          }

          const result = operatorProvider.get(curr);
          if (result instanceof Array) {
            operators.push(...result);
          } else if (result) {
            operators.push(result);
          }
        }
      }
    },

    get(node) {
      return scope[node.key];
    },
  };
}

type MaybeArr<T> = T | T[];

export interface OperatorProvider {
  get(node: ReactiveNode): Operator[] | Operator | null;
  dependencies(node: ReactiveNode): MaybeArr<ReactiveNode>;
}

function reconcile(
  g: ReactiveGraph,
  offset: number,
  dirty: { [key: symbol]: boolean }
): void | Promise<void> {
  const promises: Promise<void>[] = [];
  const scope = g.scope;

  for (let i = offset; i < g.operators.length; i++) {
    const operator = g.operators[i];
    const { source } = operator;

    if (dirty[source] === true) {
      const { type } = operator;
      const sourceValue = g.scope[source];
      if (sourceValue === undefined) {
        continue;
      }

      if (sourceValue instanceof Promise) {
        scope[source] = sourceValue;
        promises.push(
          sourceValue.then((resolved) => {
            if (g.scope[source] === sourceValue) {
              scope[source] = resolved;
              return reconcile(g, i, dirty);
            }
          })
        );
        continue;
      }

      switch (type) {
        case OperatorEnum.When:
          break;
        case OperatorEnum.Prop:
          {
            const { target } = operator;
            const targetValue = sourceValue[operator.prop];
            if (targetValue !== undefined && g.scope[target] !== targetValue) {
              g.scope[target] = targetValue;
              dirty[target] = true;
            }
          }
          break;
        case OperatorEnum.Call:
          {
            const { target } = operator;
            const targetValue = operator.func.call(
              operator.context,
              sourceValue
            );
            if (targetValue !== undefined && targetValue !== g.scope[target]) {
              g.scope[target] = targetValue;
              dirty[target] = true;
            }
          }
          break;
        case OperatorEnum.Export:
          g.output[operator.prop] = sourceValue;
          break;
        case OperatorEnum.Connect:
          {
            const { target } = operator;
            const targetScope = g.scope[target];
            const operatorProp = operator.prop;
            const currentValue = targetScope[operatorProp];
            if (currentValue !== sourceValue) {
              targetScope[operatorProp] = sourceValue;
              dirty[target] = true;
            }
          }
          break;
        case OperatorEnum.CombineLatest:
          {
            const { target } = operator;
            if (sourceValue.some((x: any) => x instanceof Promise)) {
              g.scope[target] = Promise.all(sourceValue);
            } else {
              g.scope[target] = sourceValue;
            }
            dirty[target] = true;
          }
          break;
        default:
          console.error(`operator type '${OperatorEnum[type]}' not supported`);
      }
    }
  }

  if (promises.length) {
    return Promise.all(promises) as any;
  }
}
