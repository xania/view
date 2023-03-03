import { State } from '../observable/state';

export function fromPromise<T>(promise: Promise<T>): State<T> {
  const state = new State<T>();

  async function bind() {
    try {
      const value = await promise;
      state.set(value);
    } catch (e) {
      console.log(e);
    }
  }

  bind();

  return state;
}
