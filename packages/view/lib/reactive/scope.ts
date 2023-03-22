import { MappedState, Stateful } from '.';
import { resolve } from '../utils/resolve';
export const scopeProp = Symbol('scope');

export class Scope {
  private readonly values = new Map<ManagedState, any>();

  // snapshot(state: ManagedState): Snapshot {
  //   const key = state[scopeProp] ?? (state[scopeProp] = Math.random());
  //   const { snaps } = this;
  //   return snaps[key] ?? (snaps[key] = { value: state.initial });
  // }

  get(state: ManagedState) {
    const { values } = this;
    if (values.has(state)) {
      return values.get(state)!;
    } else {
      return undefined;
    }
  }

  set(state: ManagedState, newValue: any) {
    const { values } = this;
    if (values.has(state)) {
      const currentValue = values.get(state);
      if (newValue === currentValue) {
        return false;
      }
    }
    values.set(state, newValue);
    return true;
  }
}

type ManagedState = any;

type StateOperator = TextOperator | MapOperator | EventOperator;

interface EventOperator {
  type: 'event';
}
interface TextOperator {
  type: 'text';
  text: Text;
}

interface MapOperator {
  type: 'map';
  map: (x: any) => any;
  target: Stateful;
}

export class Graph {
  private readonly nodes: Map<ManagedState, StateOperator[]> = new Map();

  get(node: ManagedState) {
    return this.nodes.get(node);
  }

  connect(node: ManagedState, operator: StateOperator) {
    const { nodes } = this;

    if (nodes.has(node)) {
      nodes.get(node)!.push(operator);
    } else {
      nodes.set(node, [operator]);
    }
  }

  add(node: ManagedState) {
    if (node instanceof MappedState) {
      this.connect(node.source, {
        type: 'map',
        map: node.mapper,
        target: node,
      });
    }
  }

  append(other: Graph) {
    for (const [node, ops] of other.nodes) {
      if (this.nodes.has(node)) {
        this.nodes.get(node)!.push(...ops);
      } else {
        this.nodes.set(node, [...ops]);
      }
    }
  }

  sync(scope: Scope, node: ManagedState, newValue: any) {
    const res: any[] = [];

    const operators = this.nodes.get(node);
    if (operators) {
      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        switch (operator.type) {
          case 'text':
            operator.text.data = newValue;
            break;
          case 'map':
            const mappedValue = operator.map(newValue);
            if (scope.set(operator, mappedValue)) {
              if (mappedValue instanceof Promise) {
                res.push(
                  mappedValue.then((resolved) => {
                    if (
                      scope.get(operator) === mappedValue &&
                      scope.set(operator.target, resolved)
                    ) {
                      return this.sync(scope, operator.target, resolved);
                    }
                  })
                );
              } else if (scope.set(operator.target, mappedValue)) {
                res.push(this.sync(scope, operator.target, mappedValue));
              }
            }
            break;
          case 'event':
            console.log('event', scope.get(node));
            res.push(node);
            break;
        }
      }
    }

    return res;
  }
}
