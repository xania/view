import { keyProp } from '.';

export class Scope {
  public values: Record<number, any> = {};

  get(state: ManagedState) {
    const key = state[keyProp];
    if (key === undefined) {
      return undefined;
    }
    return this.values[key] ?? state.snapshot;
  }

  set(state: ManagedState, newValue: any) {
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

  setProp(state: ManagedState, prop: number | string | symbol, newValue: any) {
    const key = state[keyProp];
    const { values } = this;

    if (key === undefined) {
      const newKey = Math.random();
      state[keyProp] = newKey;
      values[newKey] = { [prop]: newValue };
      return true;
    }

    const obj = values[key] ?? (values[key] = {});

    const oldValue = obj[prop];
    if (oldValue !== newValue) {
      obj[prop] = newValue;
      return true;
    }
    return false;
  }
}

interface ManagedState extends JSX.State {
  [keyProp]?: any;
}
