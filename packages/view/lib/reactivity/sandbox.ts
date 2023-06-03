import { AnchorNode, ElementNode, NodeFactory, ViewNode } from '../factory';
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
import { Each } from './each';
import { EffectNode, Node, Program } from './program';
import {
  Export,
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

// const dirty = Symbol('dirty');
export class Sandbox implements Record<number | symbol, any> {
  program = new Program();
  disposed: boolean = false;
  nodes?: Collection<ViewNode>;
  promises?: Collection<Promise<any>>;
  subscriptions?: Collection<Subscription>;
  disposables?: Collection<Disposable>;
  classList?: Collection<string>;
  [p: number | symbol]: any;

  constructor(public parent?: Sandbox) {}

  get<T>(node: Reactive<T>): Value<T> {
    const scope = this; // as Record<number, any>;
    const scopeValue = scope[node.key];

    if (scopeValue !== undefined) {
      return scopeValue;
    }

    const parent = this.parent;
    if (parent) {
      return parent.get(node);
    }

    return node.initial;
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
      return this.program.update(this, command.state, command.valueOrCompute);
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

  track(...nodes: (EffectNode | Node)[]) {
    this.program.track(...nodes);
    return this.program.reconcile(this);
  }

  update<T>(
    state: Reactive<T>,
    newValueOrReduce: Value<T> | ((value?: T) => Value<T>)
  ) {
    return this.program.update(this, state, newValueOrReduce);
  }

  reconcile() {
    return this.program.reconcile(this);
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
