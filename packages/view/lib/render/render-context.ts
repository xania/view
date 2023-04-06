import { Disposable } from '../disposable';
import {
  Command,
  isCommand,
  ListMutationCommand,
  mapValue,
  Stateful,
  StateMapper,
  StateProperty,
  UpdateCommand,
  UpdateStateCommand,
} from '../reactive';
import { ListMutation } from '../reactive/list/mutation';
import { texpand } from '../tpl';
import { syntheticEvent } from './render-node';
import { Subscription } from './subscibable';
import { RenderTarget } from './target';

const stateProp = Symbol('state');

export class RenderContext implements RenderTarget {
  public children: RenderContext[] = [];

  public nodes: Node[] = [];
  public disposables: Disposable[] = [];
  public subscriptions: Subscription[] = [];
  public events: Record<string, [HTMLElement, JSX.EventHandler][]> = {};
  public disposed = false;

  constructor(
    public container: RenderTarget,
    public scope = new Map<number | ValueOperator, any>(),
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

  addEventListener: RenderTarget['addEventListener'] = (
    eventName,
    eventHandler
  ) => {
    return this.container.addEventListener(eventName, eventHandler);
  };

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

  handleCommands(command: JSX.Sequence<Command>) {
    return texpand<Command>(command, this.handleCommand);
  }

  handleCommand = (message: Command): JSX.MaybePromise<Command | undefined> => {
    const context = this;
    if (context.disposed) return;

    if (message instanceof UpdateCommand) {
      return message.updateFn(context) as any;
    }

    const state = message.state;
    const currentValue = context.get(state);
    if (currentValue instanceof Promise) {
      return currentValue.then((resolved) => {
        context.set(state, resolved);
        return this.handleCommand(message);
      });
    }

    if (message instanceof UpdateStateCommand) {
      const updater = message.updater;
      const newValue = mapValue(currentValue, updater);

      if (newValue !== undefined) {
        context.set(state, newValue);
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

            const operators = context.parent.graph.get(mutation.source);
            if (operators) {
              context.parent.sync(operators, array, {
                type: 'remove',
                index: context.index,
              } as ListMutation<any>);
            }
          }
          break;
      }

      const operators = context.graph.operatorsMap.get(state.key);
      if (operators) {
        context.sync(operators, currentValue, mutation);
      }
    } else {
      console.log(context);
    }
  };

  async handleEvent(originalEvent: Event) {
    const eventName = originalEvent.type;
    const delegates = this.events[eventName];

    if (delegates) {
      for (const dlg of delegates) {
        const target = dlg[0];
        if (target.contains(originalEvent.target as any)) {
          const eventHandler = dlg[1];
          let eventObj: any = null;

          eventObj ??= syntheticEvent(eventName, originalEvent, target);

          if (eventHandler instanceof Function) {
            return this.handleCommands(eventHandler(eventObj));
          } else if (!isCommand(eventHandler)) {
            return this.handleCommands(eventHandler.handleEvent(eventObj));
          }
          return this.handleCommands(eventHandler);
        }
      }
    }
  }

  // applyCommands(
  //   commands: JSX.Template<Command>,
  //   applyChange?: BindFunction<any, any>
  // ): any {
  //   const context = this;
  //   return templateBind(commands, async (message: Command) => {
  //     if (this.disposed) return;
  //     if (message instanceof UpdateCommand) {
  //       return this.applyCommands(message.updateFn(context) as any) as any;
  //     }

  //     const state = message.state;
  //     const currentValue = await context.get(state);
  //     if (message instanceof UpdateStateCommand) {
  //       const updater = message.updater;

  //       const newValue = await (updater instanceof Function
  //         ? currentValue === undefined
  //           ? undefined
  //           : updater(currentValue)
  //         : updater);

  //       if (newValue !== undefined && context.set(state, newValue)) {
  //         const operators = this.graph.operatorsMap.get(state);
  //         if (operators) {
  //           const changes = context.sync(operators, newValue);
  //           if (applyChange) return templateBind(changes, applyChange);
  //         }

  //         if (state instanceof StateProperty) {
  //           let root = state.source;

  //           while (root instanceof StateProperty) {
  //             root = root.source;
  //           }

  //           const rootValue = context.get(root);
  //           const operators = this.graph.operatorsMap.get(root);
  //           if (operators) {
  //             const changes = context.sync(operators, rootValue);
  //             if (applyChange) return templateBind(changes, applyChange);
  //           }
  //         }
  //       }
  //     } else if (message instanceof ListMutationCommand) {
  //       const { mutation } = message;
  //       switch (mutation.type) {
  //         case 'add':
  //           if (mutation.itemOrGetter instanceof Function) {
  //             if (currentValue !== undefined) {
  //               const newRow = mutation.itemOrGetter(currentValue);
  //               currentValue.push(newRow);
  //             }
  //           } else {
  //             currentValue.push(mutation.itemOrGetter);
  //           }
  //           break;
  //         case 'dispose':
  //           if (context.parent) {
  //             const array = context.parent.get(mutation.source);

  //             array.splice(context.index, 1);

  //             const operators = context.parent.graph.operatorsMap.get(
  //               mutation.source
  //             );
  //             if (operators) {
  //               const changes = context.parent.sync(operators, array, {
  //                 type: 'remove',
  //                 index: context.index,
  //               } as ListMutation<any>);
  //               if (applyChange) return templateBind(changes, applyChange);
  //             }
  //           }
  //           break;
  //       }

  //       const operators = context.graph.operatorsMap.get(state);
  //       if (operators) {
  //         const changes = context.sync(operators, currentValue, mutation);
  //         if (applyChange) return templateBind(changes, applyChange);
  //       }
  //     } else {
  //       console.log(context);
  //     }
  //   });
  // }

  pending = new Map<ValueOperator, any>();
  concurrent<O extends ValueOperator>(
    operator: O,
    promise: Promise<any>,
    resolve: (operator: O, resolved: any) => any
  ) {
    this.pending.set(operator, promise);

    return promise.then((resolved) => {
      if (this.pending.get(operator) === promise) {
        resolve(operator, resolved);
      }
      this.pending.delete(operator);
    });
  }

  sync(operators: ValueOperator[], newValue: any, mutation?: any): any {
    const stack: RenderContext[] = [this];

    while (stack.length) {
      let context = stack.pop()!;

      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        switch (operator.type) {
          case 'reconcile':
            if (!context.scope.has(operator)) {
              context.scope.set(operator, []);
            }
            const previous = context.scope.get(operator);
            operator.reconcile(newValue, previous, mutation);
            break;
          case 'text':
            if (newValue instanceof Promise) {
              this.concurrent(
                operator,
                newValue,
                (operator, resolved) => (operator.text.data = resolved)
              );
            } else {
              operator.text.data = newValue;
            }
            break;
          case 'set':
            operator.object[operator.prop] = newValue;
            break;
          case 'list':
            const prevList: any[] | undefined = context.scope.get(operator);
            const newList: any[] | undefined = newValue;
            if (newList) {
              for (const x of newList) {
                operator.list.add(x);
              }
              if (prevList) {
                for (const x of prevList) {
                  if (!newList.includes(x)) {
                    operator.list.remove(x);
                  }
                }
              }
            } else if (prevList) {
              for (const x of prevList) {
                operator.list.remove(x);
              }
            }
            context.scope.set(operator, newList);
            break;
          case 'get':
          case 'map':
            const mappedValue =
              operator.type === 'map'
                ? operator.map(newValue)
                : newValue[operator.prop];

            if (mappedValue instanceof Promise) {
              this.concurrent(operator, mappedValue, (operator, resolved) => {
                this.set(operator.target, resolved);
              });
            } else {
              this.set(operator.target, mappedValue);
            }
            break;
          case 'show':
            if (newValue) {
              operator.element.attach();
            } else {
              operator.element.detach();
            }
            break;
          case 'effect':
            operator.effect(newValue, operator.node);
            break;
          // case 'event':
          //   res.push({ state: node });
          //   break;
        }
      }

      // for (const child of context.children) {
      //   stack.push(child);
      // }
    }
  }

  connect(node: Stateful<any>, operator: ValueOperator) {
    const { operatorsMap } = this.graph;

    if (!operatorsMap.has(node.key)) {
      if (node instanceof StateMapper) {
        this.connect(node.source, {
          type: 'map',
          map: node.mapper,
          target: node,
        });
      } else if (node instanceof StateProperty) {
        this.connect(node.source, {
          type: 'get',
          prop: node.name,
          target: node,
        });
      }
    }

    const currentValue = this.get(node);
    if (currentValue !== undefined) {
      this.sync([operator], currentValue);
    }

    const key = node.key;
    if (operatorsMap.has(key)) {
      operatorsMap.get(key)!.push(operator);
    } else {
      operatorsMap.set(key, [operator]);
    }
  }

  get(state: NonNullable<any>): any {
    if (state instanceof StateProperty) {
      const currentSource = this.get(state.source);
      if (currentSource === null || currentSource === undefined) {
        return currentSource;
      }
      return currentSource[state.name];
    } else if (this.scope.has(state.key)) {
      return this.scope.get(state.key);
    } else {
      return state.initial;
    }
  }

  set(state: Stateful, newValue: any): boolean {
    const { scope } = this;

    if (state instanceof StateProperty) {
      const currentSource = scope.get(state.source.key);
      if (currentSource) {
        if (currentSource[state.name] !== newValue) {
          currentSource[state.name] = newValue;

          const sourceOperators = this.graph.operatorsMap.get(state.source.key);
          if (sourceOperators) {
            this.sync(sourceOperators, currentSource);
          }
        } else {
          return false;
        }
      } else {
        return this.set(state.source, { [state.name]: newValue });
      }
    } else {
      const currentValue = scope.get(state.key);
      if (newValue === currentValue) {
        return false;
      } else {
        scope.set(state.key, newValue);
      }
    }

    const operators = this.graph.operatorsMap.get(state.key);
    if (operators) {
      this.sync(operators, newValue);
    }

    return true;
  }
}

export type ValueOperator =
  | ShowOperator
  | TextOperator
  | MapOperator
  | GetOperator
  | SetOperator
  // | EventOperator
  | ReconcileOperator<any, any>
  | ListOperator<any>
  | EffectOperator;

// interface EventOperator {
//   type: 'event';
// }
interface TextOperator {
  type: 'text';
  text: Text;
}

interface EffectOperator<T = any> {
  type: 'effect';
  node: Node;
  effect: (value: T, node: Node) => void;
}

interface ListOperator<T = any> {
  type: 'list';
  list: { add(x: T): any; remove(x: T): any };
}

interface SetOperator {
  type: 'set';
  object: Record<string, string>;
  prop: string;
}

interface GetOperator {
  type: 'get';
  prop: string;
  target: Stateful;
}

export interface ShowOperator {
  type: 'show';
  element: SynthaticElement;
}

interface MapOperator {
  type: 'map';
  map: (x: any) => any;
  target: Stateful;
}

export class Graph {
  public readonly operatorsMap: Map<number, ValueOperator[]> = new Map();

  has(node: Stateful) {
    return (node as any)[stateProp] !== undefined;
  }

  get(node: Stateful) {
    return this.operatorsMap.get(node.key);
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

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {}

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
