import { ListChanges, changes } from './changes';
import { Each } from './each';
import {
  Append,
  Export,
  Computed,
  Effect,
  Join,
  ObjectAssign,
  Property,
  Reactive,
  Value,
  When,
} from './reactive';
import { State } from './state';

export class Program {
  private nodes: Node[] = [];

  track(...nodes: (EffectNode | Node)[]) {
    const { nodes: inner } = this;

    const stack = [];

    // const promises: Promise<any>[] = [];

    for (const node of nodes as any) {
      let tracked = false;
      for (const existing in inner) {
        if (node === existing) {
          tracked = true;
          break;
        }
      }
      if (tracked) {
        break;
      }

      if (node instanceof Join) {
        const { sources } = node;
        stack.push(node);
        nodes.push(...sources);
      } else if (node instanceof Computed) {
        stack.push(node);
        nodes.push(node.input);
      } else if (node instanceof Export) {
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
      } else if (node instanceof Each) {
        stack.push(node);
        nodes.push(node.source);
      } else if (node instanceof ObjectAssign) {
        stack.push(node);
        nodes.push(node.source);
      } else {
        throw Error('Cannot track unknown node type', {
          cause: node,
        });
      }
    }

    const startIndex = inner.length;

    for (let i = stack.length - 1; i >= 0; i--) {
      inner.push(stack[i]);
    }

    return startIndex;
  }

  reconcile(
    scope: Scope,
    startIndex: number = 0,
    promises: Promise<any>[] = []
  ): any {
    const { nodes: graph } = this;
    for (let index = startIndex, len = graph.length; index < len; index++) {
      const node = graph[index];

      if (node instanceof Each) {
        const source = node.source;
        const scopeValue = get(scope, source.key) ?? source.initial;

        if (scopeValue !== undefined) {
          const accumulator = (scope[node.key] ??= new ListChanges([], []));
          changes(node, scopeValue, accumulator);
        }
      } else if (node instanceof Append) {
        const { state } = node;
        const scopeValue = get(scope, state.key) ?? state.initial;

        const previous = scope[node.key];
        scope[node.key] = scopeValue;

        if (previous instanceof Array) {
          node.list.remove(...previous);
        }

        if (scopeValue instanceof Array) {
          node.list.add(...scopeValue);
        }
      } else if (node instanceof Export) {
        const state = node.state as any;
        const scopeValue = get(scope, state.key) ?? state.initial;

        if (scopeValue !== undefined) {
          node.target[node.property] = scopeValue;
        }
      } else if (node instanceof When) {
        const state = node.state;
        const scopeValue = get(scope, state.key) ?? state.initial;

        if (scopeValue !== undefined) {
          if (scopeValue === node.value) {
            scope[node.key] = node.tru;
          } else {
            scope[node.key] = node.fals;
          }
        }
      } else if (node instanceof Effect) {
        const state = node.state;
        const scopeValue = get(scope, state.key) ?? state.initial;

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
        const inputNode = node.input;
        const inputValue = get(scope, inputNode.key) ?? inputNode.initial;
        const nodeIndex = index;

        const resultValue = Computed.compute(inputValue, node.func);

        scope[node.key] = resultValue;
        if (resultValue instanceof Promise) {
          return resultValue.then<any>((resolved) => {
            // check concurrent update
            if (scope[node.key] === resultValue) {
              scope[node.key] = resolved;
              if (resolved !== undefined) {
                return this.reconcile(scope, nodeIndex + 1, promises);
              }
            }
          });
        } else if (resultValue !== undefined) {
          const computedKey = node.key;
          const scopeValue = get(scope, node.key) ?? node.initial;

          if (resultValue === scopeValue) {
            // skip no change
          } else if (resultValue !== undefined) {
            scope[computedKey] = resultValue;
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
      } else if (node instanceof Join) {
        const { sources, project } = node as any;

        const newValue: any[] = [];

        for (let i = 0, len = sources.length; i < len; i++) {
          const source = sources[i];
          let sourceValue = get(scope, source);
          newValue[i] = sourceValue;
        }

        if (project instanceof Function) {
          scope[node.key] = project.apply(null, newValue);
        } else {
          scope[node.key] = newValue;
        }
      } else if (node instanceof ObjectAssign) {
        const source = node.source;
        const scopeValue = get(scope, source.key) ?? source.initial;

        if (scopeValue !== undefined) {
          const object = get(scope, node.objectKey);
          if (object !== undefined) {
            object[node.property] = scopeValue;
          }
        }
      }
    }

    return promises;
  }

  update<T>(
    scope: Scope,
    state: Reactive<T>,
    newValueOrReduce: Value<T> | ((value?: T) => Value<T>)
  ): JSX.MaybeArray<Promise<any>> | void {
    const currentValue = get(scope, state.key) ?? state.initial;

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
      return newValue.then((resolved) => this.update(scope, state, resolved));
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
      return this.reconcile(scope, 0, promises);
    }

    scope[nodeKey] = nodeValue;
    const nodeIndex = this.nodes.indexOf(node);
    if (nodeIndex >= 0) {
      return this.reconcile(scope, nodeIndex + 1, promises);
    }
  }
}

const parentKey = Symbol();

export interface Scope extends Record<symbol | number | string, any> {
  [parentKey]?: Scope;
}

export type EffectNode = Effect | Export | Append | ObjectAssign;
export type Node = Reactive | EffectNode;

export function get<T>(scope: Scope, state: Reactive<T>): Value<T>;
export function get(scope: Scope, key: symbol): Value;
export function get<T = any>(
  scope: Scope,
  key: Reactive<T> | symbol
): Value<T> {
  if (key instanceof Reactive) {
    return get(scope, key.key) ?? key.initial;
  } else {
    const scopeValue = scope[key];

    if (scopeValue !== undefined) {
      return scopeValue;
    }

    const parent = scope[parentKey];
    if (parent) {
      return get(parent, key);
    }
  }
}
