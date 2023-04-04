import { Disposable } from '../disposable';
import {
  Command,
  isCommand,
  ListMutationCommand,
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

export class RenderContext implements RenderTarget {
  public children: RenderContext[] = [];

  public nodes: Node[] = [];
  public disposables: Disposable[] = [];
  public subscriptions: Subscription[] = [];
  public events: Record<string, [HTMLElement, JSX.EventHandler][]> = {};
  public disposed = false;

  constructor(
    public container: RenderTarget,
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

  // handleCommands(eventHandler: JSX.EventHandler, eventObj: any) {
  //   texpand<JSX.EventHandler>(eventHandler, (handlerOrCommand) => {
  //     if (handlerOrCommand instanceof Function) {
  //       return handlerOrCommand(eventObj);
  //     } else if (isCommand(handlerOrCommand)) {
  //       return this.handleCommand(handlerOrCommand, eventObj);
  //     } else {
  // event ??= syntheticEvent(eventName, originalEvent, target);
  //       return handlerOrCommand.handleEvent(event);
  //     }
  //   });

  // }

  handleCommands(command: Command) {
    return texpand<Command>(command, (command) => {
      return this.handleCommand(command);
    });
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
      return currentValue.then((x) => {
        context.set(state, currentValue);
        return this.handleCommand(message);
      });
    }

    if (message instanceof UpdateStateCommand) {
      const updater = message.updater;

      const newValue = mapValue(currentValue, updater);

      if (currentValue !== undefined && context.set(state, newValue)) {
        const operators = this.graph.operatorsMap.get(state);
        if (operators) {
          return context.sync(operators, newValue);
        }

        if (state instanceof StateProperty) {
          let root = state.source;

          while (root instanceof StateProperty) {
            root = root.source;
          }

          const rootValue = context.get(root);
          const operators = this.graph.operatorsMap.get(root);
          if (operators) {
            return context.sync(operators, rootValue);
          }
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
              return context.parent.sync(operators, array, {
                type: 'remove',
                index: context.index,
              } as ListMutation<any>);
            }
          }
          break;
      }

      const operators = context.graph.operatorsMap.get(state);
      if (operators) {
        return context.sync(operators, currentValue, mutation);
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
            return eventHandler(eventObj) as any;
          } else if (!isCommand(eventHandler)) {
            return eventHandler.handleEvent(eventObj) as any;
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

  sync(operators: ValueOperator[], newValue: any, mutation?: any): any {
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

      for (const child of context.children) {
        stack.push(child);
      }
    }

    return Promise.all(promises);
  }

  async valueOperator(state: Stateful, operator: ValueOperator) {
    const { operatorsMap } = this.graph;

    if (!operatorsMap.has(state)) {
      if (state instanceof StateMapper) {
        await this.valueOperator(state.source, {
          type: 'map',
          map: state.mapper,
          target: state,
        });
      } else if (state instanceof StateProperty) {
        await this.valueOperator(state.source, {
          type: 'get',
          prop: state.name,
          target: state,
        });
      }
    }

    // if (operator.type === 'reconcile') {
    if (!this.scope.has(state)) {
      const init = await state.initial;

      if (init instanceof Array) {
        this.scope.set(state, init.slice(0));
      } else {
        this.scope.set(state, init);
      }
    }
    // }

    const currentValue = this.get(state);

    if (operatorsMap.has(state)) {
      operatorsMap.get(state)!.push(operator);
    } else {
      operatorsMap.set(state, [operator]);
    }

    if (currentValue !== undefined) await this.sync([operator], currentValue);
  }

  get(state: NonNullable<any>): any {
    if (state instanceof StateProperty) {
      const currentSource = this.get(state.source);
      if (currentSource === null || currentSource === undefined) {
        return currentSource;
      }
      return currentSource[state.name];
    } else {
      return this.scope.get(state);
    }
  }

  set(state: NonNullable<any>, newValue: any): boolean {
    const { scope } = this;

    if (state instanceof StateProperty) {
      const currentSource = scope.get(state.source);
      if (currentSource) {
        if (currentSource[state.name] !== newValue) {
          currentSource[state.name] = newValue;
          return true;
        } else {
          return false;
        }
      } else {
        return this.set(state.source, { [state.name]: newValue });
      }
    } else {
      const currentValue = scope.get(state);
      if (newValue === currentValue) {
        return false;
      } else {
        scope.set(state, newValue);
        return true;
      }
    }
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

function mapValue<T, U>(
  current: T | undefined,
  mapper: JSX.MaybePromise<U> | ((x: T) => JSX.MaybePromise<U>)
): JSX.MaybePromise<U | undefined> {
  if (mapper instanceof Function) {
    if (current === undefined) return undefined;
    if (current instanceof Promise) {
      return current.then((resolved) => mapValue(resolved, mapper));
    }
    return mapper(current);
  } else {
    return mapper;
  }
}
