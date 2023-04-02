import { ListMutation } from './list/mutation';
import { State, Stateful } from './state';

export class UpdateStateCommand<T = any> {
  constructor(
    public state: Stateful<T>,
    public updater: JSX.MaybePromise<T> | ((x: T) => JSX.MaybePromise<T>)
  ) {}
}

export class UpdateCommand {
  constructor(
    public updateFn: (
      this: UpdateCommand,
      scope: {
        get<T>(s: Stateful<T>): T | undefined;
      }
    ) => Generator<JSX.MaybePromise<Command>> | Command
  ) {}
}

export type UpdateFunction = (scope: {
  get<T>(s: Stateful<T>): T | undefined;
}) => Generator<JSX.MaybePromise<Command>> | Command;

export class ListMutationCommand<T = any> {
  constructor(public state: State<T>, public mutation: ListMutation<any>) {}
}

export type Command =
  | UpdateCommand
  | UpdateStateCommand<any>
  | ListMutationCommand;

export function isCommand(value: any): value is Command {
  return (
    value instanceof UpdateCommand ||
    value instanceof UpdateStateCommand ||
    value instanceof ListMutationCommand
  );
}

export function update(updateFn: UpdateCommand['updateFn']) {
  return new UpdateCommand(updateFn);
}
