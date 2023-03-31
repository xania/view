﻿import { Disposable } from '../disposable';
import {
  Command,
  isCommand,
  ListMutationCommand,
  UpdateCommand,
  Stateful,
  StateMapper,
  UpdateStateCommand,
} from '../reactive';
import { ListMutation } from '../reactive/list/mutation';
import { BindFunction, templateBind } from '../tpl';
import { syntheticEvent } from './render-node';
import { Subscription } from './subscibable';

export class RenderContext {
  public children: RenderContext[] = [];

  public nodes: Node[] = [];
  public disposables: Disposable[] = [];
  public subscriptions: Subscription[] = [];
  public events: Record<string, [HTMLElement, JSX.EventHandler][]> = {};
  public disposed = false;

  constructor(
    public container: HTMLElement,
    public scope = new Map<Stateful | ValueOperator, any>(),
    //    public scope: Scope,4
    public graph: Graph,
    public index: number,
    public parent?: RenderContext
  ) {
    // if (parent) {
    //   parent.children.push(this);
    // }
  }

  dispose() {
    this.disposed = true;

    for (const d of this.disposables) {
      d.dispose();
    }

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }

    for (const node of this.nodes) {
      (node as ChildNode).remove();
    }
  }

  appendChild(node: Node) {
    if (!this.disposed) {
      this.container.appendChild(node);
      this.nodes.push(node);
    }
  }

  applyEvents(target: HTMLElement, events: Record<string, any>) {
    for (const eventName in events) {
      const eventHandler = events[eventName];
      if (this.events[eventName]) {
        this.events[eventName].push([target, eventHandler]);
      } else {
        this.events[eventName] = [[target, eventHandler]];
        this.container.addEventListener(eventName, this, true);
      }
    }
  }

  async handleEvent(originalEvent: Event) {
    const eventName = originalEvent.type;
    const delegates = this.events[eventName];

    if (delegates) {
      for (const dlg of delegates) {
        const target = dlg[0];
        const eventHandler = await dlg[1];

        if (target.contains(originalEvent.target as any)) {
          const commands = isCommand(eventHandler)
            ? eventHandler
            : eventHandler instanceof Function
            ? eventHandler(syntheticEvent(eventName, originalEvent, target))
            : eventHandler.handleEvent(
                syntheticEvent(eventName, originalEvent, target)
              );

          this.applyCommands(commands);
        }
      }
    }
  }

  applyCommands(
    commands: JSX.Template<Command>,
    applyChange?: BindFunction<any, any>
  ): any {
    const context = this;
    return templateBind(commands, async (message: Command) => {
      if (this.disposed) return;
      if (message instanceof Function) {
        return this.applyCommands(message(context) as any) as any;
      }

      const state = message.state;
      const currentValue = await context.get(state);
      if (message instanceof UpdateStateCommand) {
        const updater = message.updater;

        const newValue = await (updater instanceof Function
          ? currentValue === undefined
            ? undefined
            : updater(currentValue)
          : updater);

        if (newValue !== undefined && context.set(state, newValue)) {
          const operators = this.graph.operatorsMap.get(state);
          if (operators) {
            const changes = context.sync(operators, newValue);
            if (applyChange) return templateBind(changes, applyChange);
          }
        }
      } else if (message instanceof ListMutationCommand) {
        const { mutation } = message;
        switch (mutation.type) {
          case 'add':
            if (mutation.itemOrGetter instanceof Function) {
              if (currentValue !== undefined) {
                const newRow = mutation.itemOrGetter(currentValue);
                currentValue.push(newRow);
              }
            } else {
              currentValue.push(mutation.itemOrGetter);
            }
            break;
          case 'dispose':
            if (context.parent) {
              const array = context.parent.get(mutation.source);

              array.splice(context.index, 1);

              const operators = context.parent.graph.operatorsMap.get(
                mutation.source
              );
              if (operators) {
                const changes = context.parent.sync(operators, array, {
                  type: 'remove',
                  index: context.index,
                } as ListMutation<any>);
                if (applyChange) return templateBind(changes, applyChange);
              }
            }
            break;
        }

        const operators = context.graph.operatorsMap.get(state);
        if (operators) {
          const changes = context.sync(operators, currentValue, mutation);
          if (applyChange) return templateBind(changes, applyChange);
        }
      } else {
        console.log(context);
      }
    });
  }

  sync(operators: ValueOperator[], newValue: any, mutation?: any) {
    const promises: Promise<any>[] = [];

    const stack: RenderContext[] = [this];

    while (stack.length) {
      let context = stack.pop()!;
      const { graph } = context;

      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        switch (operator.type) {
          case 'reconcile':
            if (!context.scope.has(operator)) {
              context.scope.set(operator, []);
            }
            const previous = context.get(operator);
            promises.push(operator.reconcile(newValue, previous, mutation));
            break;
          case 'text':
            operator.text.data = newValue;
            break;
          case 'map':
            const mappedValue = operator.map(newValue);
            if (this.set(operator, mappedValue)) {
              if (mappedValue instanceof Promise) {
                promises.push(
                  mappedValue.then((resolved) => {
                    if (
                      this.get(operator) === mappedValue &&
                      this.set(operator.target, resolved)
                    ) {
                      const operators = graph.operatorsMap.get(operator.target);
                      if (operators) {
                        return this.sync(operators, resolved);
                      }
                    }
                  })
                );
              } else if (this.set(operator.target, mappedValue)) {
                const operators = graph.operatorsMap.get(operator.target);
                if (operators) {
                  promises.push(this.sync(operators, mappedValue));
                }
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
          // case 'event':
          //   res.push({ state: node });
          //   break;
        }
      }

      for (const child of context.children) {
        stack.push(child);
      }
    }

    return Promise.all(promises);
  }

  async initialize(state: Stateful) {}

  async valueOperator(state: Stateful, operator: ValueOperator) {
    const { operatorsMap } = this.graph;

    if (state instanceof StateMapper && !operatorsMap.has(state)) {
      await this.valueOperator(state.source, {
        type: 'map',
        map: state.mapper,
        target: state,
      });
    }

    if (!this.scope.has(state)) {
      const init = await state.initial;

      if (init instanceof Array) {
        this.scope.set(state, init.slice(0));
      } else {
        this.scope.set(state, init);
      }
    }

    const currentValue = this.scope.get(state);

    if (operatorsMap.has(state)) {
      operatorsMap.get(state)!.push(operator);
    } else {
      operatorsMap.set(state, [operator]);
    }

    if (currentValue !== undefined) await this.sync([operator], currentValue);
  }

  get(state: NonNullable<any>): any {
    return this.scope.get(state);
  }

  set(state: NonNullable<any>, newValue: any) {
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
  // | EventOperator
  | ReconcileOperator<any, any>;

// interface EventOperator {
//   type: 'event';
// }
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

export interface ReconcileOperator<T, U> {
  type: 'reconcile';
  reconcile: (
    data: T[],
    previous: U[],
    mutation?: ListMutation<any>
  ) => Promise<void>;
}
