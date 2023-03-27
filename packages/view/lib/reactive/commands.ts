import { RenderContext } from '../render/render-context';
import { BindFunction, templateBind } from '../tpl';
import { ListMutation } from './list/mutation';
import { Stateful } from './state';

export class UpdateCommand<T = unknown> {
  constructor(public state: Stateful<T>, public updater: T | ((x: T) => T)) {}
}

export class PushRowCommand<T = any> {
  constructor(
    public state: Stateful<T[]>,
    public itemOrGetter: T | ((arr: T[]) => T)
  ) {}
}

export class RemoveRowCommand {
  constructor(public state: Stateful) {}
}

export type Command = UpdateCommand | PushRowCommand | RemoveRowCommand;

/////////////////////////////////////////
//// helper methods /////////////////
/////////////////////////////////////////

export function push<T>(
  state: Stateful<T[]>,
  itemOrGetter: T | ((arr: T[]) => T)
) {
  return new PushRowCommand(state, itemOrGetter);
}

export function remove<T>(state: Stateful) {
  return new RemoveRowCommand(state);
}

export function isCommand(value: Command): value is Command {
  return (
    value instanceof UpdateCommand ||
    value instanceof PushRowCommand ||
    value instanceof RemoveRowCommand
  );
}

export function applyCommands(
  context: RenderContext,
  commands: JSX.Template<Command>,
  applyChange?: BindFunction<any, any>
) {
  return templateBind(commands, (message: Command) => {
    const state = message.state;
    let baseContext: RenderContext = context;

    while (baseContext.parent) {
      if (baseContext.scope.has(state)) {
        break;
      }
      baseContext = baseContext.parent;
    }

    const currentValue = baseContext.get(state) ?? state.initial;

    if (message instanceof UpdateCommand) {
      const updater = message.updater;

      const newValue =
        updater instanceof Function ? updater(currentValue) : updater;

      if (
        newValue !== undefined &&
        newValue !== currentValue &&
        baseContext.set(state, newValue)
      ) {
        const changes = baseContext.sync(state, newValue);
        if (applyChange) return templateBind(changes, applyChange);
      }
    } else if (message instanceof PushRowCommand) {
      const { itemOrGetter } = message;

      const item =
        itemOrGetter instanceof Function
          ? itemOrGetter(currentValue)
          : itemOrGetter;
      currentValue.push(item);

      const mutation: ListMutation<any> = {
        type: 'add',
        item,
      };

      const changes = baseContext.sync(state, currentValue, mutation);
      if (applyChange) return templateBind(changes, applyChange);
    } else if (message instanceof RemoveRowCommand) {
      console.log(baseContext);
    }
  });
}
