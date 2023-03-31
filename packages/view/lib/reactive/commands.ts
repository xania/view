import { ListMutation } from './list/mutation';
import { State, Stateful } from './state';

export class UpdateStateCommand<T = unknown> {
  constructor(public state: Stateful<T>, public updater: T | ((x: T) => T)) {}
}

export class UpdateCommand {
  constructor(
    public updateFn: (scope: {
      get<T>(s: Stateful<T>): T | undefined;
    }) => Generator<JSX.Template<Command>> | JSX.Template<Command>
  ) {}
}

export type UpdateFunction = UpdateCommand['updateFn'];

export class ListMutationCommand<T = any> {
  constructor(public state: State<T>, public mutation: ListMutation<any>) {}
}

export type Command = UpdateFunction | UpdateStateCommand | ListMutationCommand;

export function isCommand(value: any): value is Command {
  return (
    value instanceof Function ||
    value instanceof UpdateStateCommand ||
    value instanceof ListMutationCommand
  );
}
