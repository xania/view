import { RenderContext } from '../render/render-context';
import { Stateful } from './state';

class UpdateMessage<T> {
  constructor(public state: Stateful<T>, public updater: (x: T) => T) {}

  handleEvent(_: any, context: RenderContext) {
    const { scope } = context;
    const state: any = this.state;
    const currentValue = scope.get(state) ?? state.snapshot;
    const newValue = this.updater(currentValue);

    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      scope.set(state, newValue)
    ) {
      context.graph.sync(scope, state, newValue);
    }
  }
}

export function update<T>(state: Stateful<T>, updater: (x: T) => T) {
  return new UpdateMessage(state, updater);
}
