import { Scope, Stateful, StateMapper } from '../reactive';
import { Template } from '../tpl';
import { RenderTarget } from './target';

type Command = ApplyState | null;

interface ApplyState {
  state: Stateful;
}

export class RenderContext {
  public children: RenderContext[] = [];

  constructor(
    public scope: Scope,
    public graph: Graph,
    public parent?: RenderContext
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  sync(node: Stateful, newValue: any) {
    const res: Template<Command>[] = [];

    const stack: RenderContext[] = [this];

    while (stack.length) {
      let context = stack.pop()!;
      const { graph } = context;
      const operators = graph.nodes.get(node);
      if (operators) {
        for (let i = 0; i < operators.length; i++) {
          const operator = operators[i];
          switch (operator.type) {
            case 'text':
              operator.text.data = newValue;
              break;
            case 'map':
              const mappedValue = operator.map(newValue);
              if (this.set(operator, mappedValue)) {
                if (mappedValue instanceof Promise) {
                  res.push(
                    mappedValue.then((resolved) => {
                      if (
                        this.get(operator) === mappedValue &&
                        this.set(operator.target, resolved)
                      ) {
                        return this.sync(operator.target, resolved);
                      }
                    })
                  );
                } else if (this.set(operator.target, mappedValue)) {
                  res.push(this.sync(operator.target, mappedValue));
                }
              }
              break;
            case 'view':
              if (newValue) {
                operator.element.attach();
              } else {
                operator.element.detach();
              }
              break;
            case 'event':
              res.push({ state: node });
              break;
          }
        }
      }

      for (const child of context.children) {
        stack.push(child);
      }
    }

    return res;
  }

  get(state: Stateful | StateOperator): any {
    return this.scope.values.get(state);
  }

  set(state: Stateful | StateOperator, newValue: any) {
    const { values } = this.scope;

    const currentValue = values.get(state);
    if (newValue === currentValue) {
      return false;
    } else {
      values.set(state, newValue);
      return true;
    }
  }
}

export type StateOperator =
  | ViewOperator
  | TextOperator
  | MapOperator
  | EventOperator;

interface EventOperator {
  type: 'event';
}
interface TextOperator {
  type: 'text';
  text: Text;
}

export interface ViewOperator {
  type: 'view';
  element: SynthaticElement;
}

interface MapOperator {
  type: 'map';
  map: (x: any) => any;
  target: Stateful;
}

export class Graph {
  public readonly nodes: Map<Stateful, StateOperator[]> = new Map();

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
}

export class SynthaticElement implements RenderTarget {
  public nodes: Node[] = [];
  public events: any[] = [];
  public attached = false;

  constructor(public anchorNode: Comment) {}

  appendChild(node: Node) {
    this.nodes.push(node);

    if (this.attached) {
      const { anchorNode } = this;
      const parentElement = anchorNode.parentElement!;

      parentElement.insertBefore(node, anchorNode);
    }
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

    this.attached = true;
  }

  detach() {
    const { anchorNode } = this;
    const parentElement = anchorNode.parentElement!;

    for (const child of this.nodes) {
      parentElement.removeChild(child);
    }

    this.attached = false;
  }

  dispose() {}
}
