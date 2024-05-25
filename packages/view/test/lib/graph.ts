export type ReactiveGraph = {
  readonly nodes: ReactiveNode[];
  readonly scope: { [key: symbol]: any };
  readonly operators: Operator[];
  push(node: ReactiveNode): void;
  get(node: { key: symbol }): any;
  update<T>(node: ReactiveNode, newValue: T): boolean | Promise<boolean>;
};

interface ReactiveNode {
  key: symbol;
  initial?: any;
}

export enum OperatorEnum {
  Prop = 1,
  Computed = 2,
  Assign = 3,
  CombineLatest = 4,
}

export type Operator =
  | GetOperator
  | AssignOperator
  | ComputedOperator
  | CombineLatestOperator;

export interface GetOperator {
  type: OperatorEnum.Prop;
  source: symbol;
  target: symbol;
  prop: string;
}

export interface AssignOperator {
  type: OperatorEnum.Assign;
  source: symbol;
  target: symbol;
  prop: string | number;
}

export interface CombineLatestOperator {
  type: OperatorEnum.CombineLatest;
  source: symbol;
  target: symbol;
}

export interface ComputedOperator {
  type: OperatorEnum.Computed;
  source: symbol;
  target: symbol;
  compute: Function;
}

export function create(operatorProvider: OperatorProvider): ReactiveGraph {
  const nodes: ReactiveNode[] = [];
  const lookups: { [key: symbol]: ReactiveNode } = {};
  const scope: ReactiveGraph['scope'] = {};
  const operators: Operator[] = [];
  return {
    nodes,
    scope,
    operators,
    update<T>(node: ReactiveNode, newValue: T) {
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
      const { type, target } = operator;
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

      dirty[source] === false;

      switch (type) {
        case OperatorEnum.Prop:
          {
            const targetValue = sourceValue[operator.prop];
            if (targetValue !== undefined && g.scope[target] !== targetValue) {
              g.scope[target] = targetValue;
              dirty[target] = true;
            }
          }
          break;
        case OperatorEnum.Computed:
          {
            const targetValue = operator.compute(sourceValue);
            if (targetValue !== undefined && targetValue !== g.scope[target]) {
              g.scope[target] = targetValue;
              dirty[target] = true;
            }
          }
          break;
        case OperatorEnum.Assign:
          const targetScope = g.scope[target];
          const operatorProp = operator.prop;
          const currentValue = targetScope[operatorProp];
          if (currentValue !== sourceValue) {
            targetScope[operatorProp] = sourceValue;
            dirty[target] = true;
          }
          break;
        case OperatorEnum.CombineLatest:
          {
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
