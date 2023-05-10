import { AnchorNode, ElementNode, NodeFactory, ViewNode } from '../factory';
import { Disposable } from '../render/disposable';
import { sexpand } from '../seq/expand';
import { Collection, Subscription, cwalk } from '../utils';
import {
  Command,
  DomCommand,
  UpdateCommand,
  UpdateStateCommand,
} from './command';
import {
  Assign,
  Computed,
  Effect,
  Property,
  When,
  Join,
  Append,
  Reactive,
  Value,
} from './reactive';
import { State } from './state';

type Node =
  | State
  | Computed
  | Property
  | Effect
  | Assign
  | When
  | Join
  | Append
  | Reactive<any>;

// const dirty = Symbol('dirty');
export class Sandbox implements Record<number | symbol, any> {
  private graph: Node[] = [];
  private indexKey = Symbol('gidx');
  disposed: boolean = false;
  nodes?: Collection<ViewNode>;
  promises?: Collection<Promise<any>>;
  subscriptions?: Collection<Subscription>;
  disposables?: Collection<Disposable>;
  classList?: Collection<string>;
  [p: number | symbol]: any;

  constructor(public parent?: Sandbox) {}

  track(...nodes: Node[]) {
    const { graph, indexKey } = this;

    const stack = [];

    const promises: Promise<any>[] = [];

    for (const node of nodes as any) {
      if (node[indexKey] !== undefined) {
        break;
      }
      if (node instanceof Join) {
        const { sources } = node;
        stack.push(node);
        nodes.push(...sources);
      } else if (node instanceof Computed) {
        stack.push(node);
        nodes.push(node.input);
      } else if (node instanceof Assign) {
        stack.push(node);
        nodes.push(node.state);
      } else if (node instanceof Property) {
        stack.push(node);
        nodes.push(node.parent);
      } else if (node instanceof Effect) {
        stack.push(node);
        nodes.push(node.state);
      } else if (node instanceof When) {
        stack.push(node);
        nodes.push(node.state);
      } else if (node instanceof State) {
        // State is implicitly included in the list of nodes of the graph
        // and always maps with provided node.key

        const { initial } = node;
        const scope = this as any;

        (node as any)[indexKey] = node.key;
        if ((scope as any)[node.key] === undefined) {
          (scope as any)[node.key] = initial;
        }

        if (initial instanceof Promise) {
          promises.push(
            initial.then((resolved) => {
              if (initial === scope[node.key]) {
                scope[node.key] = resolved;
                return this.reconcile(0);
              }
            })
          );
        }
      } else if (node instanceof Append) {
        stack.push(node);
        nodes.push(node.state);
      } else {
        throw Error('Cannot track unknown node type', {
          cause: node,
        });
      }
    }

    const startIndex = graph.length;

    for (let i = stack.length - 1; i >= 0; i--) {
      const node = stack[i];
      if ((node as any)[indexKey] === undefined) {
        (node as any)[indexKey] = graph.length;
        graph.push(node);
      }
    }

    return this.reconcile(startIndex, promises);
  }

  reconcile(startIndex: number, promises: Promise<any>[] = []) {
    const { graph, indexKey } = this;
    const scope = this as Record<number | symbol, any>;
    for (let index = startIndex, len = graph.length; index < len; index++) {
      const node = graph[index];

      if (node instanceof Append) {
        const { state } = node as any;
        const stateIndex = state[indexKey];
        const scopeValue = scope[stateIndex];

        const previous = scope[index];

        scope[index] = scopeValue;

        if (previous instanceof Array) {
          node.list.remove(...previous);
        }

        if (scopeValue instanceof Array) {
          node.list.add(...scopeValue);
        }
      } else if (node instanceof Assign) {
        const state = node.state as any;
        const index = state[indexKey];
        const scopeValue = scope[index];

        if (scopeValue !== undefined) {
          node.target[node.property] = scopeValue;
        }
      } else if (node instanceof When) {
        const state = node.state as any;
        const stateIndex = state[indexKey];
        const scopeValue = scope[stateIndex];

        if (scopeValue !== undefined) {
          if (scopeValue === node.value) {
            scope[index] = node.tru;
          } else {
            scope[index] = node.fals;
          }
        }
      } else if (node instanceof Effect) {
        const state = node.state as any;
        const stateIndex = state[this.indexKey];
        const scopeValue = scope[stateIndex];

        if (scopeValue !== undefined) {
          const previous = scope[index];
          if (previous instanceof Promise) {
            const next = (scope[index] = previous.then((resolved) => {
              if (scope[index] === next) {
                scope[index] = node.effect(scopeValue, resolved);
              } else {
                // concurrent async effect call is detected. this will chain to this promise
                // but need to use previous accumulator value.
                // so we cancel current effect and return previous accumulator.
                return resolved;
              }
            }));
            promises.push(next);
          } else {
            scope[index] = node.effect(scopeValue, previous);
          }
        }
      } else if (node instanceof Computed) {
        const inputNode = node.input as any;
        const inputIndex = inputNode[indexKey];
        const inputValue = scope[inputIndex];

        if (inputValue instanceof Promise) {
          promises.push(inputValue);
          // skip pending
        } else if (inputValue !== undefined) {
          const result = node.compute(inputValue);

          const computedIndex = index;
          const scopeValue = scope[computedIndex];

          if (result === scopeValue) {
            // skip no change
          } else {
            scope[computedIndex] = result;
            if (result instanceof Promise) {
              promises.push(
                result.then((resolved) => {
                  if (result !== scope[computedIndex]) {
                    return;
                  }
                  if (scopeValue !== resolved) {
                    scope[computedIndex] = resolved;
                    return this.reconcile(computedIndex + 1);
                  }
                })
              );
            }
          }

          // const stateValue
        } else {
          // console.log(node);
        }
      } else if (node instanceof Property) {
        const parentNode = node.parent as any;
        const parentIndex = parentNode[indexKey];
        const parentValue = scope[parentIndex] as any;

        if (parentValue !== undefined) {
          const nodeValue = parentValue[node.name];
          scope[index] = nodeValue;
        }
      } else if (node instanceof Join) {
        const { sources, project } = node as any;

        const newValue: any[] = [];

        for (let i = 0, len = sources.length; i < len; i++) {
          const source = sources[i];
          const sourceIndex = source[indexKey];
          newValue[i] = scope[sourceIndex];
        }

        if (project instanceof Function) {
          scope[index] = project.apply(null, newValue);
        } else {
          scope[index] = newValue;
        }
      }
    }

    return promises;
  }

  get(node: Node) {
    const { indexKey } = this;
    const scope = this as Record<number, any>;
    const index = (node as any)[indexKey];
    const scopeValue = scope[index];

    if (scopeValue !== undefined) {
      return scopeValue;
    }

    if (node instanceof State) {
      return node.initial;
    }
  }

  update<T>(
    state: Reactive<T>,
    newValueOrReduce: Value<T> | ((value?: T) => Value<T>)
  ): JSX.MaybeArray<Promise<any>> | void {
    const { indexKey } = this;
    const scope = this as Record<number | symbol, any>;

    const stateIndex = (state as any)[this.indexKey];
    const currentValue = scope[stateIndex] as T | undefined;

    const newValue =
      newValueOrReduce instanceof Function
        ? currentValue instanceof Promise
          ? currentValue.then(newValueOrReduce)
          : newValueOrReduce(currentValue)
        : newValueOrReduce;

    if (newValue instanceof Promise) {
      return newValue.then((resolved) => this.update(state, resolved));
    }

    if (currentValue === newValue) {
      return;
    }

    let node = state;
    let nodeValue: unknown = newValue;
    let nodeIndex: number = stateIndex;
    while (node instanceof Property) {
      const parentNode = node.parent as any;
      const parentIndex = parentNode[indexKey];
      const parentValue = scope[parentIndex] as Record<string, unknown>;

      if (parentValue === undefined) {
        nodeValue = { [node.name]: nodeValue };
      } else {
        parentValue[node.name] = nodeValue;
        nodeValue = parentValue;
      }
      node = parentNode;
      nodeIndex = parentIndex;
    }

    const promises: Promise<any>[] = [];
    if (this.parent) {
      this.parent.reconcile(0, promises);
    }

    if (node instanceof State) {
      scope[node.key] = nodeValue;
      this.reconcile(0, promises);
      return promises;
    }

    scope[nodeIndex] = nodeValue;

    this.reconcile(nodeIndex + 1, promises);

    return promises;
  }

  handleCommands(
    commands: any,
    currentTarget: ElementNode | AnchorNode<ElementNode>
  ) {
    return sexpand<Command>(commands, this.handleCommand, currentTarget);
  }

  handleCommand = (
    command: Command,
    currentTarget: ElementNode | AnchorNode<ElementNode>
  ): CommandResult => {
    if (this.disposed) {
      return;
    }

    if (command instanceof UpdateStateCommand) {
      return this.update(command.state, command.valueOrCompute);
    } else if (command instanceof DomCommand) {
      return command.handler(currentTarget);
    } else if (command instanceof UpdateCommand) {
      return command.updateFn();
    }
  };

  dispose() {
    this.disposed = true;
    cwalk(this.nodes, removeNode);
    cwalk(this.disposables, dispose);
    cwalk(this.subscriptions, unsubscribe);
  }
}

function dispose(d: Disposable) {
  d.dispose();
}

function removeNode(node: ViewNode | undefined) {
  if (node) {
    node.remove();
  }
}

function unsubscribe(subscription: Subscription) {
  subscription.unsubscribe();
}

type CommandResult =
  | Generator<CommandResult>
  | JSX.MaybeArray<Promise<CommandResult>>
  | Command
  | void;
