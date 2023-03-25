import { Stateful, StateMapper } from '.';
import { RenderTarget } from '../render/target';
import { Template } from '../tpl/template';
import { resolve } from '../utils/resolve';
export const scopeProp = Symbol('scope');

export class Scope {
  private readonly values = new Map<Stateful | StateOperator, any>();

  // snapshot(state: ManagedState): Snapshot {
  //   const key = state[scopeProp] ?? (state[scopeProp] = Math.random());
  //   const { snaps } = this;
  //   return snaps[key] ?? (snaps[key] = { value: state.initial });
  // }

  get(state: Stateful | StateOperator) {
    const { values } = this;
    if (values.has(state)) {
      return values.get(state)!;
    } else {
      return undefined;
    }
  }

  set(state: Stateful | StateOperator, newValue: any) {
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

type StateOperator = ViewOperator | TextOperator | MapOperator | EventOperator;

interface EventOperator {
  type: 'event';
}
interface TextOperator {
  type: 'text';
  text: Text;
}

export interface ViewOperator {
  type: 'view';
  element: JSX.MaybePromise<SynthaticElement>;
}

interface MapOperator {
  type: 'map';
  map: (x: any) => any;
  target: Stateful;
}

export class Graph {
  private readonly nodes: Map<Stateful, StateOperator[]> = new Map();

  get(node: Stateful) {
    return this.nodes.get(node);
  }

  connect(node: Stateful, operator: StateOperator) {
    const { nodes } = this;

    if (nodes.has(node)) {
      nodes.get(node)!.push(operator);
    } else {
      nodes.set(node, [operator]);
    }

    if (node instanceof StateMapper) {
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

  sync(scope: Scope, node: Stateful, newValue: any) {
    const res: Template<Command>[] = [];

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
          case 'view':
            if (operator.element instanceof Promise) {
              operator.element.then((element) => {
                if (newValue) {
                  element.attach();
                } else {
                  element.detach();
                }
              });
            }
            break;
          case 'event':
            res.push({ state: node });
            break;
        }
      }
    }

    return res;
  }
}

type Command = ApplyState | null;

interface ApplyState {
  state: Stateful;
}

export class SynthaticElement implements RenderTarget {
  public nodes: Node[] = [];
  public events: any[] = [];

  constructor(public anchorNode: Comment) {}

  appendChild(node: Node) {
    this.nodes.push(node);
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions | undefined
  ) {
    return true;
  }
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions | undefined
  ) {
    return true;
  }

  attach() {
    const { anchorNode } = this;
    const parentElement = anchorNode.parentElement!;

    for (const child of this.nodes) {
      parentElement.insertBefore(child, anchorNode);
    }
  }

  detach() {
    const { anchorNode } = this;
    const parentElement = anchorNode.parentElement!;

    for (const child of this.nodes) {
      parentElement.removeChild(child);
    }
  }

  dispose() {}
}
