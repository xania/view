import { RenderContext } from '../render/render-context';
import { BindFunction, Template, templateBind } from '../tpl';
import { Stateful } from './state';

export class UpdateCommand<T = any> {
  constructor(public state: Stateful<T>, public updater: (x: T) => T) {}
}

export function applyUpdates(
  context: RenderContext,
  commands: Template<UpdateCommand>,
  applyChange?: BindFunction<any, any>
) {
  return templateBind(commands, (message: UpdateCommand) => {
    const { scope } = context;
    const state: any = message.state;
    const currentValue = scope.get(state) ?? state.initial;
    const newValue = message.updater(currentValue);

    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      scope.set(state, newValue)
    ) {
      const changes = context.graph.sync(scope, state, newValue);
      if (applyChange) return templateBind(changes, applyChange);
    }
  });
}
