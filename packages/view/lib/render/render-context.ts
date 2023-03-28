import { Disposable } from '../disposable';
import { applyCommands, isCommand, Stateful, StateMapper } from '../reactive';
import { ListMutation } from '../reactive/list/mutation';
import { syntheticEvent } from './render-node';
import { RenderTarget } from './target';

interface ApplyState {
  state: Stateful;
}

export class RenderContext {
  public children: RenderContext[] = [];

  private nodes: Node[] = [];
  public disposables: Disposable[] = [];
  public promises: Promise<any>[] = [];
  public events: Record<string, [HTMLElement, JSX.EventHandler][]> = {};

  constructor(
    public element: RenderTarget,
    public scope = new Map<Stateful | ValueOperator, any>(),
    //    public scope: Scope,4
    public graph: Graph,
    public parent?: RenderContext
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  appendChild(node: Node) {
    this.element.appendChild(node);
    this.nodes.push(node);
  }

  applyEvents(target: HTMLElement, events: Record<string, any>) {
    for (const eventName in events) {
      const eventHandler = events[eventName];
      if (this.events[eventName]) {
        this.events[eventName].push([target, eventHandler]);
      } else {
        this.events[eventName] = [[target, eventHandler]];
        this.element.addEventListener(eventName, this, true);
      }
    }
  }

  handleEvent(originalEvent: Event) {
    const eventName = originalEvent.type;
    const delegates = this.events[eventName];

    if (delegates) {
      for (const [target, eventHandler] of delegates) {
        if (target.contains(originalEvent.target as any)) {
          const commands = isCommand(eventHandler)
            ? eventHandler
            : eventHandler instanceof Function
            ? eventHandler(syntheticEvent(eventName, originalEvent, target))
            : eventHandler.handleEvent(
                syntheticEvent(eventName, originalEvent, target)
              );

          applyCommands(this, commands);
        }
      }
    }
  }

  sync(node: Stateful, newValue: any, mutation?: ListMutation<any>) {
    const res: JSX.Template<ApplyState>[] = [];

    const stack: RenderContext[] = [this];

    while (stack.length) {
      let context = stack.pop()!;
      const { graph } = context;
      const operators = graph.operatorsMap.get(node);
      if (operators) {
        for (let i = 0; i < operators.length; i++) {
          const operator = operators[i];
          switch (operator.type) {
            case 'list':
              if (mutation) {
                operator.apply(newValue, mutation);
              }
              break;
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

  async valueOperator(node: Stateful, operator: ValueOperator) {
    const { operatorsMap } = this.graph;

    if (node instanceof StateMapper && !operatorsMap.has(node)) {
      await this.valueOperator(node.source, {
        type: 'map',
        map: node.mapper,
        target: node,
      });
    }

    if (!this.scope.has(node)) {
      this.scope.set(node, await node.initial);
    }

    const currentValue = this.scope.get(node);

    if (operatorsMap.has(node)) {
      operatorsMap.get(node)!.push(operator);
    } else {
      operatorsMap.set(node, [operator]);
    }

    this.sync(node, currentValue);
  }

  get(state: Stateful | ValueOperator): any {
    return this.scope.get(state);
  }

  set(state: Stateful | ValueOperator, newValue: any) {
    const { scope } = this;

    const currentValue = scope.get(state);
    if (newValue === currentValue) {
      return false;
    } else {
      scope.set(state, newValue);
      return true;
    }
  }
}

export type ValueOperator =
  | ViewOperator
  | TextOperator
  | MapOperator
  | EventOperator
  | ListOperator;

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
  public readonly operatorsMap: Map<Stateful, ValueOperator[]> = new Map();
  // public readonly operatorsMap: Map<Stateful, ValueOperator[]> = new Map();

  get(node: Stateful) {
    return this.operatorsMap.get(node);
  }

  append(other: Graph) {
    for (const [node, operators] of other.operatorsMap) {
      if (this.operatorsMap.has(node)) {
        this.operatorsMap.get(node)!.push(...operators);
      } else {
        this.operatorsMap.set(node, [...operators]);
      }
    }
  }
}

export class SynthaticElement {
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
      if (child.parentElement) parentElement.removeChild(child);
    }

    this.attached = false;
  }

  dispose() {}
}

export interface ListOperator<T = any> {
  type: 'list';
  apply: (data: T[], mutation: ListMutation<T>) => any;
}
