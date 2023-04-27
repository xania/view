import {
  AppendOperator,
  AssignOperator,
  EffectOperator,
  Operator,
  OperatorType,
  PropertyOperator,
  ComputeOperator,
} from './operator';
import { Computed, Property, State, Value } from './state';
import { Collection, cpush, cwalk } from '../utils/collection';
import {
  Command,
  DomCommand,
  UpdateCommand,
  UpdateStateCommand,
} from './command';
import { ListItemState, ListMutationState } from './list';
import { ElementNode, AnchorNode, ViewNode } from '../factory';
import { Subscription } from '../utils/observable';
import { Disposable } from '../render/disposable';
import { sexpand, smap } from '../seq';

interface EventManager<TElement> {
  addListener(eventName: string, sandbox: Sandbox<TElement>): any;
}

export class Sandbox<TElement = ElementNode> {
  operatorsKey = Symbol();
  accumulatorKey = Symbol();
  events: Record<string, [TElement, JSX.EventHandler][]> | undefined;
  disposed: boolean = false;
  nodes?: Collection<ViewNode>;
  promises?: Collection<Promise<any>>;
  subscriptions?: Collection<Subscription>;
  disposables?: Collection<Disposable>;
  classList?: Collection<string>;

  constructor(
    public eventManager: EventManager<TElement>,
    public valueKey = Symbol(),
    public model?: any,
    public parent?: Sandbox
  ) {}

  applyEvent(
    target: TElement,
    eventName: string,
    eventHandler: JSX.EventHandler
  ) {
    const { events } = this;
    if (events === undefined) {
      this.events = {
        [eventName]: [[target, eventHandler]],
      };
      this.eventManager.addListener(eventName, this);
    } else if (events[eventName]) {
      events[eventName].push([target, eventHandler]);
    } else {
      events[eventName] = [[target, eventHandler]];
      this.eventManager.addListener(eventName, this);
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

      (source as any)[operatorsKey] = cpush(
        (source as any)[operatorsKey],
        operator
      );

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
      } else if (source instanceof ListItemState && this.model !== undefined) {
        const stack: [Value, JSX.MaybeArray<Operator>][] = [
          [this.model, operator],
        ];
        this.reconcile(stack);
      }
    }
  }

  refresh(state: State) {
    const { operatorsKey, valueKey } = this;
    const sourceOperators: JSX.MaybeArray<Operator> | undefined = (
      state as any
    )[operatorsKey];

    const currentValue =
      state instanceof ListItemState
        ? this.model
        : (state as any)[valueKey] ?? state.initial;

    const stack: [Value, JSX.MaybeArray<Operator>][] = [];
    cwalk(sourceOperators, (parentOperator) => {
      stack.push([currentValue, parentOperator]);
    });

    this.reconcile(stack);
  }

  onChange(state: Reactive, newValue: any) {
    const { operatorsKey, valueKey } = this;

    const stack: [Value, JSX.MaybeArray<Operator>][] = [];

    if (state instanceof Property) {
      let parent = state.parent as State & Reactive;
      let childValue = newValue;

      while (parent) {
        const parentValue =
          parent instanceof ListItemState
            ? this.model
            : parent[valueKey] ?? parent.initial;

        setValue(parentValue, state.name, childValue);
        cwalk(
          parent[operatorsKey] as JSX.MaybeArray<Operator>,
          (parentOperator) => {
            if (parentOperator.type !== OperatorType.Property) {
              stack.push([parentValue, parentOperator]);
            }
          }
        );

        if (parent instanceof Property) {
          parent = parent.parent as State & Reactive;
          childValue = parentValue;
        } else if (parent instanceof ListItemState) {
          const { listState, owner, items } = parent;
          const changes = owner.onChange(listState.source as any, items);
          cwalk((listState.source as any)[owner.operatorsKey], (operator) => {
            if (
              operator.type === OperatorType.Compute &&
              operator.target !== listState
            ) {
              changes.push([items, operator]);
            }
          });
          owner.reconcile(changes);
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
    } else if (state instanceof ListItemState) {
      console.log(state);
    }

    return stack;
  }

  update<T>(
    state: State<T>,
    valueOrReduce: Value<T> | ((value: T) => Value<T>)
  ): void;
  update<T>(
    state: State<T> & Reactive,
    newValueOrReduce: Value<T> | ((value: T) => Value<T>)
  ) {
    const { valueKey, operatorsKey } = this;

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
      if (state instanceof ListItemState) {
        debugger;
      }

      const stack = this.onChange(state, newValue);

      cwalk(state[operatorsKey] as Collection<Operator>, (operator) => {
        stack.push([newValue, operator]);
      });

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
          if (operator.object) {
            operator.effect.apply(operator.object, [newValue]);
          } else {
            operator.effect(newValue);
          }
          break;
        case OperatorType.Assign:
          // console.log(OperatorType[operator.type], operator.property);
          // console.log(operator.target[operator.property], '=> ', newValue);

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

          smap(newValue, (value) => {
            operator.list.add(value);
            (operator as any)[accumulatorKey] = cpush(
              (operator as any)[accumulatorKey],
              value
            );
          });
          break;

        case OperatorType.Property:
        case OperatorType.Compute:
          const { target } = operator as any;
          const previous = target[valueKey];
          const computedValue =
            operator.type === OperatorType.Property
              ? newValue[operator.property]
              : operator.compute(newValue, previous);

          if (computedValue !== previous) {
            target[valueKey] = computedValue;

            // if (operator.type === OperatorType.Property)
            //   console.log(OperatorType[operator.type], operator.property);
            // else
            //   console.log(OperatorType[operator.type], operator.compute.name);

            // console.log('=> ', computedValue);

            const nextOperators = target[operatorsKey];
            if (nextOperators) {
              stack.push([computedValue, nextOperators]);
            }
          }

          break;
      }
    }
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

function removeNode(node: ViewNode | undefined) {
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
