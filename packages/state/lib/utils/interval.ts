import { State } from '../observable/state';

export function interval<T>(ms: number, valueFn: () => T) {
  const state = new State<T>();

  setInterval(() => {
    state.set(valueFn());
  }, ms);

  return state;
}
