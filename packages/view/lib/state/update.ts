import { Scope } from './index';

class UpdateMessage2<T> {
  constructor(public state: JSX.State<T>, public updater: (x: T) => T) {}

  handleEvent(_: any, scope: Scope) {
    const signal: any = this.state;
    const currentValue = scope.get(signal) ?? signal.snapshot;
    const newValue = this.updater(currentValue);

    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      scope.set(signal, newValue)
    ) {
      return sync(signal, scope);
    }
    return [];
  }
}

export function update<T>(state: JSX.State<T>, updater: (x: T) => T) {
  return new UpdateMessage2(state, updater);
}

function sync(state: JSX.State & { operators: any[] }, scope: Scope) {
  const changes: JSX.State[] = [state];
  const currentValue = scope.get(state);

  if (currentValue === undefined) return changes;

  for (const op of state.operators) {
    const { target } = op;

    const newValue = op.mapper(currentValue);
    if (
      newValue !== undefined &&
      newValue !== currentValue &&
      scope.set(target, newValue)
    ) {
      changes.push(...sync(target, scope));
    }
  }

  return changes;
}
