import { RenderContext } from '../render/render-context';
import { BindFunction, Template, templateBind } from '../tpl';
import { Stateful } from './state';

export class UpdateMessage<T = any> {
  constructor(public state: Stateful<T>, public updater: (x: T) => T) {}
}

export function update<T>(state: Stateful<T>, updater: (x: T) => T) {
  return new UpdateMessage(state, updater);
}

export function applyUpdates(
  context: RenderContext,
  messages: Template<UpdateMessage>,
  applyChange?: BindFunction<any, any>
) {
  return templateBind(messages, (message: UpdateMessage) => {
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
