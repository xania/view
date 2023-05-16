import { ElementNode, AnchorNode } from '../factory';
import { Reactive, Value } from './reactive';

export type Command =
  | DispatchCommand
  | UpdateCommand
  | UpdateStateCommand
  | DomCommand;

export function isCommand(value: any): value is Command {
  if (value === null || value === undefined) return false;
  const ctor = value.constructor;
  return (
    ctor === UpdateCommand ||
    ctor === UpdateStateCommand ||
    ctor === DispatchCommand
  );
}

export class UpdateStateCommand<T = any> {
  constructor(
    public state: Reactive<T>,
    public valueOrCompute: JSX.MaybePromise<T> | ((x: T) => JSX.MaybePromise<T>)
  ) {}
}

export class DispatchCommand {
  constructor(public command: Command) {}
}

export function dispatch(command: Command) {
  return new DispatchCommand(command);
}

export class UpdateCommand {
  constructor(
    public updateFn: (
      this: UpdateCommand,
      scope: { get<T>(node: Reactive<T>): Value<T> }
    ) => Generator<JSX.MaybePromise<Command>> | JSX.MaybePromise<Command | void>
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
