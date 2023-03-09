import { State } from '../observable';

export function distinct<T extends object, K extends keyof T>(key: K) {
  const target = new State<T>(undefined);
  let prev: T[K] | undefined | null = null;
  return (value: T) => {
    if (value !== undefined && value !== null) {
      const next = value[key];
      if (next !== prev) {
        prev = next;
        target.set(value);
      }
    }
    return target;
  };
}
