import { RenderContext } from '../render/render-context';
import { BindFunction, templateBind } from '../tpl';
import { isListMutation, ListMutation } from './list/mutation';
import { Stateful } from './state';

export class UpdateCommand<T = unknown> {
  constructor(public state: Stateful<T>, public updater: T | ((x: T) => T)) {}
}

export class ListMutationCommand<T = any> {
  constructor(
    public state: Stateful<T[]>,
    public mutation: ListMutation<any>
  ) {}
}

export type Command = UpdateCommand | ListMutationCommand;

/////////////////////////////////////////
//// helper methods /////////////////
/////////////////////////////////////////

export function isCommand(value: Command): value is Command {
  return value instanceof UpdateCommand || value instanceof ListMutationCommand;
}

export function applyCommands(
  context: RenderContext,
  commands: JSX.Template<Command>,
  applyChange?: BindFunction<any, any>
) {
  return templateBind(commands, async (message: Command) => {
    const state = message.state;
    let baseContext: RenderContext = context;

    while (baseContext.parent) {
      if (baseContext.scope.has(state)) {
        break;
      }
      baseContext = baseContext.parent;
    }

    const currentValue = await baseContext.get(state);

    if (message instanceof UpdateCommand) {
      const updater = message.updater;

      const newValue = await (updater instanceof Function
        ? currentValue === undefined
          ? undefined
          : updater(currentValue)
        : updater);

      if (newValue !== undefined && baseContext.set(state, newValue)) {
        const changes = baseContext.sync(state, newValue);
        if (applyChange) return templateBind(changes, applyChange);
      }
    } else if (message instanceof ListMutationCommand) {
      const { mutation } = message;
      switch (mutation.type) {
        case 'add':
          if (mutation.itemOrGetter instanceof Function) {
            if (currentValue !== undefined) {
              const newRow = mutation.itemOrGetter(currentValue);
              currentValue.push(newRow);
            }
          } else {
            currentValue.push(mutation.itemOrGetter);
          }
          break;
      }

      const changes = baseContext.sync(state, currentValue, mutation);
      if (applyChange) return templateBind(changes, applyChange);
    } else {
      console.log(baseContext);
    }
  });
}
