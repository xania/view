import { State } from '../observable/state';

export function interval<T>(valueOrFunc: T | (() => T), ms: number = 1000) {
  const state = new State<T>();

  setInterval(() => {
    state.write(valueOrFunc instanceof Function ? valueOrFunc() : valueOrFunc);
  }, ms);

  return state;
}
