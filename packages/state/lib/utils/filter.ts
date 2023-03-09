import { State } from '../observable/state';

export function filter<T>(predicate: (value: T) => boolean) {
  const target = new State<T>();
  return (value: T) => {
    if (predicate(value)) {
      target.set(value);
    }
    return target;
  };
}
