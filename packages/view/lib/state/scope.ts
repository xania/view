import { keyProp } from '.';

export class Scope {
  public values: Record<number, any> = {};
  get(state: JSX.State & ManagedState) {
    const key = state[keyProp];
    if (key === undefined) {
      return undefined;
    }
    return this.values[key];
  }

  set(state: JSX.State & ManagedState, newValue: any) {
    const key = state[keyProp];
    const { values } = this;

    if (key === undefined) {
      const newKey = Math.random();
      state[keyProp] = newKey;
      values[newKey] = newValue;
      return true;
    }

    const oldValue = values[key];
    if (oldValue !== newValue) {
      values[key] = newValue;
      return true;
    }
    return false;
  }
}

interface ManagedState {
  [keyProp]?: any;
}
