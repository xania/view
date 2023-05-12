import { ElementNode, AnchorNode } from '../factory';
import { Reactive, Value } from './reactive';
import { Sandbox } from './sandbox';

export type Command = UpdateCommand | UpdateStateCommand | DomCommand;

export function isCommand(value: any): value is Command {
  return (
    value instanceof UpdateCommand || value instanceof UpdateStateCommand
    // value instanceof ListMutationCommand
  );
}

export class UpdateStateCommand<T = any> {
  constructor(
    public state: Reactive<T>,
    public valueOrCompute: JSX.MaybePromise<T> | ((x: T) => JSX.MaybePromise<T>)
  ) {}
}

export class UpdateCommand {
  constructor(
    public updateFn: (
      this: UpdateCommand,
      scope: { get<T>(node: Reactive<T>): Value<T> }
    ) => Generator<JSX.MaybePromise<Command>> | Command
  ) {}
}

export function update(updateFn: UpdateCommand['updateFn']) {
  return new UpdateCommand(updateFn);
}

export class DomCommand {
  constructor(
    public handler: (element: ElementNode | AnchorNode<ElementNode>) => void
  ) {}
}
