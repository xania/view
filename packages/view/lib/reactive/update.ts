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
    const state = message.state;
    let baseContext: RenderContext = context;

    while (baseContext.parent) {
      if (baseContext.scope.values.has(state)) {
        break;
      }
      baseContext = baseContext.parent;
    }

    const currentValue = baseContext.get(state) ?? state.initial;
    const newValue = message.updater(currentValue);

    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      baseContext.set(state, newValue)
    ) {
      const changes = baseContext.sync(state, newValue);
      if (applyChange) return templateBind(changes, applyChange);
    }
  });
}
