import { State } from '../observable/state';

export function interval<T>(valueFn: () => T, ms: number = 1000) {
  const state = new State<T>();

  setInterval(() => {
    state.write(valueFn());
  }, ms);

  return state;
}
