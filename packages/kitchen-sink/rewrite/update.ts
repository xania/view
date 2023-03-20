import { Computed, Rx, State, sync, syncScope } from "@xania/state";
import { Scope } from "@xania/view";

class UpdateMessage2<T> {
  constructor(public state: State<T>, public updater: (x: T) => T) {}

  handleEvent(_: any, scope: Scope) {
    const state = this.state;
    const currentValue = scope.get(state) ?? state.snapshot;
    const newValue = this.updater(currentValue);

    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      scope.set(state, newValue)
    ) {
      state.dirty = true;
      return syncScope(scope, state);
    }
    return null;
  }
}

export function update<T>(state: State<T>, updater: (x: T) => T) {
  return new UpdateMessage2(state, updater);
}
