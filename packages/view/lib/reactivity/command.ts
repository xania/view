import { ElementNode, AnchorNode } from '../factory';
import { Signal, Value } from './signal';

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
    public state: Signal<T>,
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
      scope: { get<T>(node: Signal<T>): Value<T> }
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
