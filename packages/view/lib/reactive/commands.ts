import { RenderContext } from '../render/render-context';
import { BindFunction, templateBind } from '../tpl';
import { isListMutation, ListMutation } from './list/mutation';
import { State, Stateful } from './state';

export class UpdateCommand<T = unknown> {
  constructor(public state: Stateful<T>, public updater: T | ((x: T) => T)) {}
}

export class ListMutationCommand<T = any> {
  constructor(public state: State<T>, public mutation: ListMutation<any>) {}
}

export type Command = UpdateCommand | ListMutationCommand;

/////////////////////////////////////////
//// helper methods /////////////////
/////////////////////////////////////////

export function isCommand(value: JSX.EventHandler): value is Command {
  return value instanceof UpdateCommand || value instanceof ListMutationCommand;
}
