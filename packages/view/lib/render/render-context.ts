import { Disposable } from './disposable';
import {
  Command,
  isCommand,
  ROW_KEY_OFFSET,
  ItemState,
  ListMutationCommand,
  mapValue,
  Stateful,
  StateMapper,
  StateProperty,
  UpdateCommand,
  UpdateStateCommand,
} from '../reactive';
import { texpand } from '../seq';
import { syntheticEvent } from './render-node';
import { Subscription } from './subscibable';
import { RenderTarget } from './target';

const stateProp = Symbol('state');
const indexProp = Symbol();

export class RenderContext {
  public nodes: ChildNode[] = [];
  public disposables: Disposable[] = [];
  public subscriptions: Subscription[] = [];
  public events: Record<string, [HTMLElement, JSX.EventHandler][]> = {};
  public classList: string[] = [];
  public disposed = false;
  public dettached = false;

  constructor(
    public container: HTMLElement,
    public graph: Graph,
    public index: number,
    public parent?: RenderContext,
    public anchorNode?: Comment
  ) {}

  renderRow(
    list: Stateful,
    currentValue: any,
    rowIndex: number,
    anchorNode?: Comment
  ) {
    const context = this;

    const scope = new Map();
    scope.set(list.key + ROW_KEY_OFFSET, currentValue[rowIndex]);

    const newRowContext = new RenderContext(
      context.container,
      new Graph(scope),
      rowIndex,
      context,
      anchorNode
    );

    const operators = context.graph.operatorsMap.get(list.key);
    if (operators) {
      for (const op of operators) {
        if (op.type === 'reconcile') {
          op.render([newRowContext]);
        }
      }
    }

    return newRowContext;
  }

  dettach() {
    this.dettached = true;
    for (const node of this.nodes) {
      node.remove();
    }
  }

  attach(container: HTMLElement, anchorNode?: Node) {
    this.dettached = false;
    for (const node of this.nodes) {
      if (anchorNode) {
        container.insertBefore(node, anchorNode);
      } else {
        container.appendChild(node);
      }
    }
  }

  dispose() {
    this.disposed = true;

    if (this.anchorNode) {
      this.anchorNode.remove();
    }

    for (const d of this.disposables) {
      d.dispose();
    }

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }

    for (const node of this.nodes) {
      (node as ChildNode).remove();
    }

    for (const cl of this.classList) {
      this.container.classList.remove(cl);
    }
  }

  addEventListener: RenderTarget['addEventListener'] = (
    eventName,
    eventHandler
  ) => {
    return this.container.addEventListener(eventName, eventHandler);
  };

  applyEvent(
    target: HTMLElement,
    eventName: string,
    eventHandler: JSX.EventHandler
  ) {
    if (this.events[eventName]) {
      this.events[eventName].push([target, eventHandler]);
    } else {
      this.events[eventName] = [[target, eventHandler]];
      this.container.addEventListener(eventName, this, true);
    }
  }

  handleCommands(command: JSX.Sequence<Command>) {
    return texpand<Command>(command, this.handleCommand);
  }

  handleCommand = async (message: Command): Promise<Command | undefined> => {
    const context = this;
    if (context.disposed) return;

    if (message instanceof UpdateCommand) {
      return message.updateFn(context) as any;
    }

    if (message instanceof UpdateStateCommand) {
      const state = message.state;
      const currentValue = await context.get(state);

      const updater = message.updater;
      const newValue = mapValue(currentValue, updater);

      if (newValue !== undefined) {
        context.set(state, newValue);
      }
    } else if (message instanceof ListMutationCommand) {
      const state = message.state;
      const currentValue = await context.get(state);

      const { mutation } = message;
      switch (mutation.type) {
        case 'each':
          const eachOperators = context.graph.operatorsMap.get(
            message.state.key
          );
          if (!eachOperators) break;

          for (const op of eachOperators) {
            if (op.type === 'reconcile') {
              await Promise.all(
                op.children.map((child) =>
                  child.handleCommands(mutation.command)
                )
              );
            }
          }
          this.sync(eachOperators, currentValue);
          break;
        case 'filter':
          const listOperators = context.graph.operatorsMap.get(
            message.state.key
          );
          if (!listOperators) break;

          for (const operator of listOperators) {
            if (operator.type !== 'reconcile') continue;
            operator.filter = mutation.filter;

            const children = operator.children;

            for (let i = 0; i < currentValue.length; i++) {
              const row = currentValue[i];
              const dettached = !mutation.filter(row);

              const child = children[i];
              if (dettached !== child.dettached) {
                if (dettached) child.dettach();
                else {
                  let anchorNode: ChildNode | undefined =
                    operator.listAnchorNode;
                  for (let j = i; j < children.length; j++) {
                    if (
                      !children[j].dettached &&
                      children[j].nodes.length > 0
                    ) {
                      anchorNode = children[j].nodes[0];
                      break;
                    }
                  }

                  child.attach(operator.container, anchorNode);
                }
              }
            }
          }
          break;
        case 'add':
          const list = message.state;
          if (mutation.itemOrGetter instanceof Function) {
            if (currentValue !== undefined) {
              const newRow = mutation.itemOrGetter(currentValue);
              currentValue.push(newRow);
            }
          } else {
            currentValue.push(mutation.itemOrGetter);
          }
          context.notify(list, currentValue);
          break;
        case 'dispose':
          const listContext = mutation.context;
          const rowContext = context;
          const array = listContext.get(mutation.list);
          const rowIndex = rowContext.index;
          array.splice(rowIndex, 1);

          const disposeOperators = listContext.graph.operatorsMap.get(
            message.state.key
          );
          if (disposeOperators) listContext.sync(disposeOperators, array);
          break;
      }
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
            this.handleCommands(eventHandler(eventObj));
          } else if (!isCommand(eventHandler)) {
            this.handleCommands(eventHandler.handleEvent(eventObj));
          } else {
            this.handleCommands(eventHandler);
          }
        }
      }
    }
  }

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

  sync(operators: ValueOperator[], newValue: any): any {
    const stack: RenderContext[] = [this];

    while (stack.length) {
      let context = stack.pop()!;

      for (let i = 0; i < operators.length; i++) {
        const operator = operators[i];
        switch (operator.type) {
          case 'reconcile':
            if (!this.graph.scope.has(operator.graphsKey)) {
              this.graph.scope.set(operator.graphsKey, []);
            }
            const graphs = this.graph.scope.get(operator.graphsKey) as Graph[];

            const contexts = operator.children;
            for (let i = 0, len = contexts.length; i < len; i++) {
              contexts[i].index = -1; // mark stale
            }

            const newContexts: RenderContext[] = [];

            for (
              let rowIndex = 0, len = newValue.length;
              rowIndex < len;
              rowIndex++
            ) {
              const row = newValue[rowIndex];
              if (row === null || row === undefined) {
                break; // ignore
              }

              if (
                row.constructor === Number ||
                row.constructor === String ||
                row.constructor === Symbol
              ) {
                const existingContext = contexts[rowIndex];
                existingContext.index = rowIndex;
              } else {
                const previousIndex = row[indexProp];
                row[indexProp] = rowIndex;

                if (previousIndex === undefined) {
                  // add

                  const graph = new Graph(new Map([[operator.itemKey, row]]));

                  const childContext = new RenderContext(
                    context.container,
                    graph,
                    rowIndex,
                    context
                  );
                  newContexts.push(childContext);
                } else {
                  // move
                  const previousContext = contexts[previousIndex];
                  previousContext.index = rowIndex;
                  if (previousIndex !== rowIndex) {
                    row[indexProp] = rowIndex;
                  }
                }
              }
            }

            for (let i = contexts.length - 1; i >= 0; i--) {
              const context = contexts[i];
              if (context.index === -1) {
                context.dispose();
                contexts.splice(i, 1);
              }
            }

            contexts.push(...newContexts);
            contexts.sort((x, y) => x.index - y.index);
            operator.render(newContexts);

            // operator.render(contexts);

            // if (operator.children.length > newValue.length) {
            //   for (let j = newValue.length; j < operator.children.length; j++) {
            //     operator.children[j].dispose();
            //   }

            //   operator.children.length = newValue.length;
            // }
            // if (graphs.length > newValue.length) {
            //   graphs.length = newValue.length;
            // }
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
            const prevList: any[] | undefined =
              context.graph.scope.get(operator);
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
            context.graph.scope.set(operator, newList);
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
      operatorsMap.set(node.key, [operator]);
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
    } else {
      operatorsMap.get(node.key)!.push(operator);
    }

    const currentValue = this.get(node);
    if (currentValue !== undefined) {
      this.sync([operator], currentValue);
    }
  }

  get(state: NonNullable<any>): any {
    if (this.graph.scope.has(state.key)) {
      return this.graph.scope.get(state.key);
    } else {
      return state.initial;
    }
  }

  set(state: Stateful, newValue: any): boolean {
    const { scope } = this.graph;

    const currentValue = scope.get(state.key);
    if (newValue === currentValue) {
      return false;
    }
    scope.set(state.key, newValue);

    if (state instanceof StateProperty) {
      const currentSource = scope.get(state.source.key);
      if (currentSource) {
        if (currentSource[state.name] !== newValue) {
          currentSource[state.name] = newValue;
        }
        // } else {
        //   this.set(state.source, { [state.name]: newValue });
      }
    }

    this.notify(state, newValue);

    return true;
  }

  notify(state: Stateful, stateValue: any) {
    const operators = this.graph.operatorsMap.get(state.key);
    if (operators) {
      this.sync(operators, stateValue);
    }

    if (state instanceof StateProperty) {
      this.notify(state.source, this.get(state.source));
    } else {
      if (state instanceof ItemState) {
        const listOperators = state.listContext.graph.operatorsMap.get(
          state.list.key
        );
        const data = state.listContext.get(state.list);
        if (listOperators && data) {
          state.listContext.sync(listOperators, data);
        }
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
  | ReconcileOperator<any>
  | ListOperator<any>
  | EffectOperator
  | RenderOperator;

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

  constructor(public scope = new Map<number | ValueOperator, any>()) {}

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

export interface ReconcileOperator<T> {
  type: 'reconcile';
  children: RenderContext[];
  itemKey: number;
  graphsKey: number;
  template: any;
  container: HTMLElement;
  listAnchorNode: Comment;
  render(contexts: RenderContext[]): Promise<any>;
  filter?: (item: any) => boolean;
}

export interface RenderOperator {
  type: 'render';
  render(context: RenderContext): Promise<any>;
}
