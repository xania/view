import { Disposable, texpand, tmap } from '@xania/view';
import {
  AppendOperator,
  AssignOperator,
  EffectOperator,
  Operator,
  OperatorType,
  PropertyOperator,
  ComputeOperator,
} from './operator';
import { Computed, Model, Property, State, Value } from './state';
import { push } from './utils';
import { Collection, cwalk } from './collection';
import { Subscription } from '../render/subscibable';
import { syntheticEvent } from '../render/render-node';
import {
  Command,
  DomCommand,
  UpdateCommand,
  UpdateStateCommand,
  isCommand,
} from './command';
import { ListMutationState } from './list';
import { AnchorElement } from '../render/browser/anchor-element';

export class Sandbox {
  operatorsKey = Symbol();
  accumulatorKey = Symbol();
  events: Record<string, [HTMLElement, JSX.EventHandler][]> | undefined;
  disposed: boolean = false;
  nodes?: Collection<ChildNode>;
  promises?: Collection<Promise<any>>;
  subscriptions?: Collection<Subscription>;
  disposables?: Collection<Disposable>;
  classList?: JSX.MaybeArray<string>;

  constructor(
    public container: Element,
    public valueKey = Symbol(),
    public model?: any
  ) {
    if (container instanceof Text) {
      console.log(container);
    }
  }

  applyEvent(
    target: HTMLElement,
    eventName: string,
    eventHandler: JSX.EventHandler
  ) {
    const { events } = this;
    if (events === undefined) {
      this.events = {
        [eventName]: [[target, eventHandler]],
      };
      this.container.addEventListener(eventName, this, true);
    } else if (events[eventName]) {
      events[eventName].push([target, eventHandler]);
    } else {
      events[eventName] = [[target, eventHandler]];
      this.container.addEventListener(eventName, this, true);
    }
  }

  async handleEvent(originalEvent: Event) {
    const { events } = this;
    if (!events) {
      return;
    }

    const eventName = originalEvent.type;
    const delegates = events[eventName];

    if (delegates) {
      for (const dlg of delegates) {
        const target = dlg[0];
        if (target.contains(originalEvent.target as any)) {
          const eventHandler = dlg[1];
          let eventObj: any = null;

          eventObj ??= syntheticEvent(eventName, originalEvent, target);

          if (eventHandler instanceof Function) {
            const command = eventHandler(eventObj);
            if (command) {
              this.handleCommands(command, target);
            }
          } else if (!isCommand(eventHandler)) {
            this.handleCommands(eventHandler.handleEvent(eventObj), target);
          } else {
            this.handleCommands(eventHandler, target);
          }
        }
      }
    }
  }

  connect<T, O, P extends keyof O>(
    source: State<T>,
    operator: AssignOperator<O, P>
  ): void;
  connect<T>(source: State<T[]>, operator: AppendOperator<T>): void;
  connect<T>(source: State<T>, operator: ComputeOperator<T>): void;
  connect<T, P extends keyof T>(
    source: State<T>,
    operator: PropertyOperator<T, P>
  ): void;
  connect<T, U>(source: State<T>, operator: ComputeOperator<T, U>): void;
  connect<T, U>(source: State<T>, operator: EffectOperator<T, U>): void;

  connect(source: State<any>, operator: Operator): void {
    const initial = (source as any)[this.valueKey] ?? source.initial;

    if (initial !== undefined) {
      const stack: [Value, JSX.MaybeArray<Operator>][] = [[initial, operator]];
      this.reconcile(stack);
    }

    const arrows: [State, Operator][] = [[source, operator]];

    const { operatorsKey } = this;
    while (arrows.length) {
      const [source, operator] = arrows.pop()!;

      push(source, operatorsKey, operator);

      if (source instanceof Computed) {
        arrows.push([
          source.source,
          {
            type: OperatorType.Compute,
            compute: source.compute,
            target: source,
          },
        ]);
      } else if (source instanceof Property) {
        arrows.push([
          source.parent,
          {
            type: OperatorType.Property,
            property: source.name,
            target: source,
          },
        ]);
      } else if (source instanceof Model && this.model !== undefined) {
        const stack: [Value, JSX.MaybeArray<Operator>][] = [
          [this.model, operator],
        ];
        this.reconcile(stack);
      }
    }
  }

  update<T>(
    state: State<T>,
    valueOrReduce: Value<T> | ((value: T) => Value<T>)
  ): void;
  update<T>(
    state: State<T> & Reactive,
    newValueOrReduce: Value<T> | ((value: T) => Value<T>)
  ) {
    const { operatorsKey, valueKey } = this;

    const currentValue: Value<T> = state[valueKey] ?? state.initial;

    const newValue =
      currentValue === undefined
        ? undefined
        : newValueOrReduce instanceof Function
        ? currentValue instanceof Promise
          ? currentValue.then(safeCallback(newValueOrReduce))
          : newValueOrReduce(currentValue)
        : newValueOrReduce;

    if (newValue !== undefined && currentValue !== newValue) {
      state[valueKey] = newValue;

      const stack: [Value, JSX.MaybeArray<Operator>][] = [];

      if (state instanceof Property) {
        let parent = state.parent as State & Reactive;
        let childValue = newValue;

        while (parent) {
          const parentValue =
            parent instanceof Model
              ? this.model
              : parent[valueKey] ?? parent.initial;

          setValue(parentValue, state.name, childValue);

          const parentOperators: JSX.MaybeArray<Operator> | undefined =
            parent[operatorsKey];

          if (parentOperators instanceof Array) {
            for (let i = 0, len = parentOperators.length; i < len; i++) {
              const parentOperator = parentOperators[i];
              if (parentOperator.type !== OperatorType.Property) {
                stack.push([parentValue, parentOperator]);
              }
            }
          } else if (parentOperators) {
            if (parentOperators.type !== OperatorType.Property) {
              stack.push([parentValue, parentOperators]);
            }
          }

          if (parent instanceof Property) {
            parent = parent.parent as State & Reactive;
            childValue = parentValue;
          } else {
            break;
          }
        }
      } else if (state instanceof ListMutationState) {
        let source = state.source as State & Reactive;
        const sourceOperators: JSX.MaybeArray<Operator> | undefined =
          source[operatorsKey];

        const items = source[valueKey] ?? source.initial;

        if (sourceOperators instanceof Array) {
          for (const operator of sourceOperators) {
            if (
              operator.type !== OperatorType.Compute ||
              operator.target !== state
            ) {
              stack.push([items, operator]);
            }
          }
        }
      }

      const stateOperators: JSX.MaybeArray<Operator> = state[operatorsKey];
      if (stateOperators) {
        if (stateOperators instanceof Array) {
          for (let i = 0, len = stateOperators.length; i < len; i++) {
            stack.push([newValue, stateOperators[i]]);
          }
        } else {
          stack.push([newValue, stateOperators]);
        }
      }

      return this.reconcile(stack);
    }
  }

  reconcile(stack: [Value, JSX.MaybeArray<Operator>][]) {
    const { valueKey, operatorsKey, accumulatorKey } = this;

    while (stack.length) {
      const [newValue, operator] = stack.pop()!;

      if (operator instanceof Array) {
        for (let i = 0, len = operator.length; i < len; i++) {
          stack.push([newValue, operator[i]]);
        }
        continue;
      }

      if (newValue instanceof Promise) {
        (operator as any)[this.valueKey] = newValue;
        newValue.then((resolved) => {
          if ((operator as any)[this.valueKey] === newValue) {
            return this.reconcile([[resolved, operator]]);
          }
        });
        continue;
      }

      switch (operator.type) {
        case OperatorType.Effect:
          operator.effect(newValue);
          break;
        case OperatorType.Assign:
          operator.target[operator.property] = newValue;
          break;

        case OperatorType.Append:
          const previouslyAppended = (operator as any)[accumulatorKey];
          if (previouslyAppended) {
            if (previouslyAppended instanceof Array) {
              for (let i = 0, len = previouslyAppended.length; i < len; i++) {
                operator.list.remove(previouslyAppended[i]);
              }
              previouslyAppended.length = 0;
            } else {
              operator.list.remove(previouslyAppended);
              (operator as any)[accumulatorKey] = null;
            }
          }

          tmap(newValue, (value) => {
            operator.list.add(value);
            push(operator, accumulatorKey, value);
          });
          break;

        case OperatorType.Property:
        case OperatorType.Compute:
          const { target } = operator as any;
          const previous = target[valueKey];
          const reducedValue =
            operator.type === OperatorType.Property
              ? newValue[operator.property]
              : operator.compute(newValue, previous);

          if (reducedValue !== previous) {
            target[valueKey] = reducedValue;
          }

          const nextOperators = target[operatorsKey];
          if (nextOperators) {
            stack.push([reducedValue, nextOperators]);
          }

          break;
      }
    }
  }

  handleCommands(commands: any, currentTarget: Element | AnchorElement) {
    return texpand<Command>(commands, this.handleCommand, currentTarget);
  }

  handleCommand = (
    command: Command,
    currentTarget: Element | AnchorElement
  ): Generator<JSX.MaybePromise<Command>> | Command | void => {
    if (this.disposed) {
      return;
    }

    if (command instanceof UpdateStateCommand) {
      this.update(command.state, command.valueOrCompute);
    } else if (command instanceof DomCommand) {
      command.handler(currentTarget);
    } else if (command instanceof UpdateCommand) {
      return command.updateFn();
    }
  };

  dispose() {
    this.disposed = true;
    cwalk(this.nodes, removeNode);

    cwalk(this.subscriptions, unsubscribe);
  }
}

function removeNode(node: ChildNode | undefined) {
  if (node) {
    node.remove();
  }
}
function unsubscribe(subscription: Subscription) {
  subscription.unsubscribe();
}

function coalesce<T>(value: Value<T>, defaultValue: Value<T>): Value<T> {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value instanceof Promise) {
    return value.then((resolved) =>
      coalesce(resolved, defaultValue)
    ) as Promise<T>;
  } else if (value) {
    return value;
  } else {
    return defaultValue;
  }
}

function setValue<T>(object: Value<T>, name: string, value: any) {
  if (object instanceof Promise) {
    /**
     * TODO concurrent set
     */
    return object.then((resolved: any) => (resolved[name] = value));
  } else {
    (object as any)[name] = value;
  }
}

type Reactive = { [s: symbol]: any; initial?: Value<any> };

function safeCallback<T, U>(callback: (x: T) => U) {
  return (value?: T) => {
    if (value === undefined) return undefined;

    return callback(value);
  };
}
