export type ReactiveGraph = {
  readonly nodes: ReactiveNode[];
  readonly scope: { [key: symbol]: any };
  readonly operators: Operator[];
  push(node: ReactiveNode): void;
  get(node: { key: symbol }): any;
  update<T>(node: ReactiveNode, newValue: T): void;
};

type MaybeArr<T> = T | T[];
interface ReactiveNode {
  key: symbol;
  dependencies?: MaybeArr<ReactiveNode>;
  parent?: ReactiveNode;
  initial?: any;
}

export enum OperatorEnum {
  Get = 1,
  Computed = 2,
  Set = 3,
}

export type Operator = GetOperator | SetOperator | ComputedOperator;

export interface GetOperator {
  type: OperatorEnum.Get;
  source: symbol;
  target: symbol;
  prop: string;
}

export interface SetOperator {
  type: OperatorEnum.Set;
  source: symbol;
  target: symbol;
  prop: string | number;
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
      reconcile(this, {
        [nodeKey]: true,
      });
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

        const { dependencies, parent } = curr;
        if (dependencies instanceof Array) {
          for (const dep of dependencies) {
            if (dep) {
              stack.push(dep);
            }
          }
        }

        if (parent) {
          stack.push(parent);
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

export interface OperatorProvider {
  get(node: ReactiveNode): Operator[] | Operator | null;
}

function set(g: ReactiveGraph, key: symbol, newValue: any) {
  if (newValue === undefined) {
    return false;
  }

  const currentValue = g.scope[key];
  if (currentValue !== newValue) {
    g.scope[key] = newValue;
    return true;
  }
  return false;
}

function reconcile(g: ReactiveGraph, dirty: { [key: symbol]: boolean }) {
  for (const operator of g.operators) {
    const { source } = operator;

    if (dirty[source] === true) {
      const { type, target } = operator;
      const sourceValue = g.scope[source];
      if (sourceValue !== undefined) {
        switch (type) {
          case OperatorEnum.Get:
            if (set(g, target, sourceValue[operator.prop])) {
              dirty[target] = true;
            }
            break;
          case OperatorEnum.Computed:
            if (set(g, target, operator.compute(sourceValue))) {
              dirty[target] = true;
            }
            break;
          case OperatorEnum.Set:
            const targetValue = g.scope[target];
            const currentValue = targetValue[operator.prop];
            if (currentValue !== sourceValue) {
              targetValue[operator.prop] = sourceValue;
              dirty[target] = true;
            }
            break;
          default:
            console.error(
              `operator type '${OperatorEnum[type]}' not supported`
            );
        }
      }
    }
  }
}
