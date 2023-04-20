import { AnchorElement } from '../render/browser/anchor-element';
import { State, Value } from './state';

export type Command = UpdateCommand | UpdateStateCommand | DomCommand;

export function isCommand(value: any): value is Command {
  return (
    value instanceof UpdateCommand || value instanceof UpdateStateCommand
    // value instanceof ListMutationCommand
  );
}

export class UpdateStateCommand<T = any> {
  constructor(
    public state: State<T>,
    public valueOrCompute: JSX.MaybePromise<T> | ((x: T) => JSX.MaybePromise<T>)
  ) {}
}

export class UpdateCommand {
  constructor(
    public updateFn: (
      this: UpdateCommand
      // scope: {
      //   get<T>(s: State<T>): T | undefined;
      // }
    ) => Generator<JSX.MaybePromise<Command>> | Command
  ) {}
}

export function update(updateFn: UpdateCommand['updateFn']) {
  return new UpdateCommand(updateFn);
}

export class DomCommand {
  constructor(public handler: (element: Element | AnchorElement) => void) {}
}
