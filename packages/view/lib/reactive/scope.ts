import { MappedState, Stateful } from '.';
export const scopeProp = Symbol('scope');

export class Scope {
  private readonly values = new Map<Stateful, any>();

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
      return state.initial;
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

interface ManagedState extends JSX.Stateful {
  [scopeProp]?: any;
}

type StateOperator = TextOperator | MapOperator;

interface TextOperator {
  type: 'text';
  text: Text;
}

interface MapOperator {
  type: 'map';
  fun: (x: any) => any;
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

  bind(node: ManagedState, textNode: Text) {
    this.connect(node, {
      type: 'text',
      text: textNode,
    });
    if (node instanceof MappedState) {
      this.connect(node.source, {
        type: 'map',
        fun: node.mapper,
        target: node,
      });
    }
  }

  sync(scope: Scope, node: ManagedState, newValue: any) {
    // const snapshot = snaps[key] ?? (snaps[key] = {});
    const operators = this.nodes.get(node);
    if (operators) {
      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        switch (operator.type) {
          case 'text':
            operator.text.data = newValue;
            break;
          case 'map':
            const mappedValue = operator.fun(newValue);
            if (scope.set(operator.target, mappedValue)) {
              this.sync(scope, operator.target, mappedValue);
            }
            break;
        }
      }
    }
  }
}
