import { AnchorNode, ElementNode, ViewNode } from '../factory';
import { Disposable } from '../render/disposable';
import { sexpand } from '../seq/expand';
import { Collection, Subscription, cwalk } from '../utils';
import {
  Command,
  DispatchCommand,
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
  CombineLatest,
  Append,
  Reactive,
  Value,
} from './reactive';
import { State } from './state';

type EffectNode = Effect | Assign | Append;
type Node = Reactive | EffectNode;

// const dirty = Symbol('dirty');
export class Sandbox implements Record<number | symbol, any> {
  private graph: Node[] = [];
  disposed: boolean = false;
  nodes?: Collection<ViewNode>;
  promises?: Collection<Promise<any>>;
  subscriptions?: Collection<Subscription>;
  disposables?: Collection<Disposable>;
  classList?: Collection<string>;
  [p: number | symbol]: any;

  constructor(public parent?: Sandbox) {}

  track(...nodes: (EffectNode | Node)[]) {
    const { graph } = this;

    const stack = [];

    const promises: Promise<any>[] = [];

    for (const node of nodes as any) {
      let tracked = false;
      for (const existing in graph) {
        if (node === existing) {
          tracked = true;
          break;
        }
      }
      if (tracked) {
        break;
      }

      if (node instanceof CombineLatest) {
        const { sources } = node;
        stack.push(node);
        nodes.push(...sources);
      } else if (node instanceof Computed) {
        stack.push(node);
        nodes.push(node.parent);
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
        stack.push(node);
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
      graph.push(stack[i]);
    }

    return this.reconcile(startIndex, promises);
  }

  reconcile(startIndex: number, promises: Promise<any>[] = []): any {
    const { graph } = this;
    const scope = this as Record<symbol, any>;
    for (let index = startIndex, len = graph.length; index < len; index++) {
      const node = graph[index];

      if (node instanceof Append) {
        const { state } = node;
        const scopeValue = this.get(state);

        const previous = scope[node.key];
        scope[node.key] = scopeValue;

        if (previous instanceof Array) {
          node.list.remove(...previous);
        }

        if (scopeValue instanceof Array) {
          node.list.add(...scopeValue);
        }
      } else if (node instanceof Assign) {
        const state = node.state as any;
        const scopeValue = this.get(state);

        if (scopeValue !== undefined) {
          node.target[node.property] = scopeValue;
        }
      } else if (node instanceof When) {
        const state = node.state;
        const scopeValue = this.get(state);

        if (scopeValue !== undefined) {
          if (scopeValue === node.value) {
            scope[node.key] = node.tru;
          } else {
            scope[node.key] = node.fals;
          }
        }
      } else if (node instanceof Effect) {
        const state = node.state;
        const scopeValue = this.get(state);

        if (scopeValue !== undefined) {
          const previous = scope[node.key];
          if (previous instanceof Promise) {
            const next = (scope[node.key] = previous.then((resolved) => {
              if (scope[node.key] === next) {
                scope[node.key] = node.effect(scopeValue, resolved);
              } else {
                // concurrent async effect call is detected. this will chain to this promise
                // but need to use previous accumulator value.
                // so we cancel current effect and return previous accumulator.
                return resolved;
              }
            }));
            promises.push(next);
          } else {
            scope[node.key] = node.effect(scopeValue, previous);
          }
        }
      } else if (node instanceof Computed) {
        const inputNode = node.parent;
        const inputValue = this.get(inputNode);

        if (inputValue instanceof Promise) {
          const nodeIndex = index;
          return inputValue.then<any>((resolved) => {
            // check concurrent update
            if (this[node.key] === inputValue) {
              if (resolved !== undefined) {
                this[node.key] = resolved;
              }
              return this.reconcile(nodeIndex + 1, promises);
            }
          });
        } else if (inputValue !== undefined) {
          const result = node.compute(inputValue);

          const computedKey = node.key;
          const scopeValue = this.get(node);

          if (result === scopeValue) {
            // skip no change
          } else if (result !== undefined) {
            scope[computedKey] = result;
            if (result instanceof Promise) {
              promises.push(
                result.then((resolved) => {
                  if (result !== scope[computedKey]) {
                    return;
                  }
                  if (scopeValue !== resolved && resolved !== undefined) {
                    scope[computedKey] = resolved;
                    return this.reconcile(0);
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
        let parentValue = scope[parentNode.key] as any;
        if (parentValue === undefined) {
          parentValue = parentNode.initial;
        }

        if (parentValue !== undefined) {
          const nodeValue = parentValue[node.name];
          scope[node.key] = nodeValue;
        }
      } else if (node instanceof CombineLatest) {
        const { sources, project } = node as any;

        const newValue: any[] = [];

        for (let i = 0, len = sources.length; i < len; i++) {
          const source = sources[i];
          let sourceValue = this.get(source);
          newValue[i] = sourceValue;
        }

        if (project instanceof Function) {
          scope[node.key] = project.apply(null, newValue);
        } else {
          scope[node.key] = newValue;
        }
      }
    }

    return promises;
  }

  get<T>(node: Reactive<T>): Value<T> {
    const scopeValue = this[node.key];

    if (scopeValue !== undefined) {
      return scopeValue;
    }

    const parent = this.parent;
    if (parent) {
      return parent.get(node);
    }

    return node.initial;
  }

  update<T>(
    state: Reactive<T>,
    newValueOrReduce: Value<T> | ((value?: T) => Value<T>)
  ): JSX.MaybeArray<Promise<any>> | void {
    const scope = this as Record<number | symbol, any>;
    const currentValue = this.get(state);

    const newValue: Value<T> =
      newValueOrReduce instanceof Function
        ? currentValue instanceof Promise
          ? currentValue.then((x) =>
              x !== undefined ? newValueOrReduce(x) : undefined
            )
          : currentValue !== undefined
          ? newValueOrReduce(currentValue)
          : undefined
        : newValueOrReduce;

    if (newValue instanceof Promise) {
      return newValue.then((resolved) => this.update(state, resolved));
    }

    if (currentValue === newValue) {
      return;
    }

    let node = state;
    let nodeValue: unknown = newValue;
    let nodeKey = node.key;
    while (node instanceof Property) {
      const parentNode = node.parent;
      const parentKey = parentNode.key;
      let parentValue = scope[parentKey] as Record<string, unknown>;

      if (parentValue === undefined) {
        nodeValue = { [node.name]: nodeValue };
      } else {
        parentValue[node.name] = nodeValue;
        nodeValue = parentValue;
      }
      node = parentNode;
      nodeKey = parentKey;
    }

    const promises: Promise<any>[] = [];

    if (node instanceof State) {
      scope[node.key] = nodeValue;
      return this.reconcile(0, promises);
    }

    scope[nodeKey] = nodeValue;
    const nodeIndex = this.graph.indexOf(node);
    if (nodeIndex >= 0) {
      return this.reconcile(nodeIndex + 1, promises);
    }
  }

  handleCommands(
    commands: JSX.Sequence<void | Command>,
    currentTarget: ElementNode | AnchorNode<ElementNode>
  ) {
    return sexpand<Command>(
      commands as JSX.Sequence<Command>,
      this.handleCommand,
      currentTarget
    );
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
      return command.updateFn(this);
    } else if (command instanceof DispatchCommand) {
      const { parent } = this;
      if (parent) {
        return parent.handleCommand(command.command, currentTarget);
      }
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
